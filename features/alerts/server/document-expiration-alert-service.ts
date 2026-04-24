import { createDataLayer, type DataLayer } from "@/features/data/repositories";
import type {
  FleetDocument,
  GeneratedOperationalAlertInput,
  OperationalAlert,
} from "@/features/data/types";
import { getDaysUntilDocumentDueDate } from "@/features/documents/lib/expiration";
import { logger } from "@/lib/logger";

const HIGH_PRIORITY_ALERT_WINDOW_DAYS = 15;
const DOCUMENT_ALERT_ORIGIN_LABEL = "Origem documental";

type IncrementalAlertSyncAction = "created" | "updated" | "deleted" | "unchanged";

export type IncrementalAlertSyncResult = {
  documentId: string;
  action: IncrementalAlertSyncAction;
};

export type AlertReconciliationResult = {
  scannedDocuments: number;
  scannedAlerts: number;
  createdAlerts: number;
  updatedAlerts: number;
  deletedAlerts: number;
  unchangedAlerts: number;
};

function formatAlertTimestamp(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function getAlertSeverity(document: FleetDocument, now: Date): OperationalAlert["severity"] {
  const daysUntilDue = getDaysUntilDocumentDueDate(document.dueDate, now);

  if (document.status === "Vencido" || (daysUntilDue !== null && daysUntilDue <= 0)) {
    return "Alta";
  }

  if (daysUntilDue !== null && daysUntilDue <= HIGH_PRIORITY_ALERT_WINDOW_DAYS) {
    return "Alta";
  }

  return "Media";
}

function getDocumentAlertLabel(document: FleetDocument) {
  if (document.associateName) {
    return `${document.name} de ${document.associateName}`;
  }

  return document.name;
}

function buildAlertTitle(document: FleetDocument, now: Date) {
  const daysUntilDue = getDaysUntilDocumentDueDate(document.dueDate, now);
  const label = getDocumentAlertLabel(document);

  if (document.status === "Vencido" || (daysUntilDue !== null && daysUntilDue < 0)) {
    return `${label} esta vencido`;
  }

  if (daysUntilDue === 0) {
    return `${label} vence hoje`;
  }

  if (daysUntilDue === 1) {
    return `${label} vence amanha`;
  }

  if (typeof daysUntilDue === "number") {
    return `${label} vence em ${daysUntilDue} dias`;
  }

  return `${label} requer atencao`;
}

function toGeneratedAlert(
  document: FleetDocument,
  now: Date,
): GeneratedOperationalAlertInput | null {
  if (document.status === "Valido") {
    return null;
  }

  return {
    title: buildAlertTitle(document, now),
    severity: getAlertSeverity(document, now),
    // `team` is a legacy display field. Generated expiration alerts should use
    // a neutral origin label instead of exposing the document author as a team.
    team: DOCUMENT_ALERT_ORIGIN_LABEL,
    createdAt: formatAlertTimestamp(now),
    sourceDocumentId: document.id,
    kind: "document_expiration",
  };
}

function isSameGeneratedAlert(
  existingAlert: OperationalAlert,
  desiredAlert: GeneratedOperationalAlertInput,
) {
  return (
    existingAlert.kind === desiredAlert.kind &&
    existingAlert.sourceDocumentId === desiredAlert.sourceDocumentId &&
    existingAlert.title === desiredAlert.title &&
    existingAlert.severity === desiredAlert.severity &&
    existingAlert.team === desiredAlert.team
  );
}

export async function syncDocumentExpirationAlertForDocument(
  document: FleetDocument,
  options?: { now?: Date; dataLayer?: DataLayer },
): Promise<IncrementalAlertSyncResult> {
  const now = options?.now ?? new Date();
  const dataLayer = options?.dataLayer ?? createDataLayer();
  const existingAlert = await dataLayer.alerts.findGeneratedBySourceDocumentId(document.id);
  const desiredAlert = toGeneratedAlert(document, now);

  if (!desiredAlert) {
    if (existingAlert) {
      await dataLayer.alerts.deleteGeneratedBySourceDocumentId(document.id);
      logger.info("alerts.document_expiration.document_synced", {
        documentId: document.id,
        action: "deleted",
      });
      return {
        documentId: document.id,
        action: "deleted",
      };
    }

    return {
      documentId: document.id,
      action: "unchanged",
    };
  }

  if (existingAlert && isSameGeneratedAlert(existingAlert, desiredAlert)) {
    return {
      documentId: document.id,
      action: "unchanged",
    };
  }

  await dataLayer.alerts.upsertGeneratedForDocument(desiredAlert);
  const action: IncrementalAlertSyncAction = existingAlert ? "updated" : "created";

  logger.info("alerts.document_expiration.document_synced", {
    documentId: document.id,
    action,
    severity: desiredAlert.severity,
  });

  return {
    documentId: document.id,
    action,
  };
}

export async function removeDocumentExpirationAlertsForDocument(
  documentId: string,
  options?: { dataLayer?: DataLayer },
) {
  const dataLayer = options?.dataLayer ?? createDataLayer();
  await dataLayer.alerts.deleteGeneratedBySourceDocumentId(documentId);

  logger.info("alerts.document_expiration.document_removed", {
    documentId,
  });
}

export async function reconcileDocumentExpirationAlerts(
  options?: { now?: Date; dataLayer?: DataLayer },
): Promise<AlertReconciliationResult> {
  const now = options?.now ?? new Date();
  const dataLayer = options?.dataLayer ?? createDataLayer();
  const [documentsRequiringAttention, generatedAlerts] = await Promise.all([
    dataLayer.documents.listRequiringAttention(now),
    dataLayer.alerts.listGenerated(),
  ]);

  const generatedAlertsByDocumentId = new Map(
    generatedAlerts
      .filter((alert) => Boolean(alert.sourceDocumentId))
      .map((alert) => [alert.sourceDocumentId as string, alert]),
  );
  const pendingDocumentIds = new Set(documentsRequiringAttention.map((document) => document.id));

  let createdAlerts = 0;
  let updatedAlerts = 0;
  let deletedAlerts = 0;
  let unchangedAlerts = 0;

  for (const document of documentsRequiringAttention) {
    const existingAlert = generatedAlertsByDocumentId.get(document.id);
    const desiredAlert = toGeneratedAlert(document, now);

    if (!desiredAlert) {
      unchangedAlerts += 1;
      continue;
    }

    if (existingAlert && isSameGeneratedAlert(existingAlert, desiredAlert)) {
      unchangedAlerts += 1;
      continue;
    }

    await dataLayer.alerts.upsertGeneratedForDocument(desiredAlert);

    if (existingAlert) {
      updatedAlerts += 1;
      continue;
    }

    createdAlerts += 1;
  }

  for (const alert of generatedAlerts) {
    if (!alert.sourceDocumentId || pendingDocumentIds.has(alert.sourceDocumentId)) {
      continue;
    }

    await dataLayer.alerts.deleteGeneratedBySourceDocumentId(alert.sourceDocumentId);
    deletedAlerts += 1;
  }

  const result = {
    scannedDocuments: documentsRequiringAttention.length,
    scannedAlerts: generatedAlerts.length,
    createdAlerts,
    updatedAlerts,
    deletedAlerts,
    unchangedAlerts,
  };

  logger.info("alerts.document_expiration.reconciled", result);

  return result;
}

export async function syncDocumentExpirationAlerts(options?: { now?: Date }) {
  return reconcileDocumentExpirationAlerts(options);
}

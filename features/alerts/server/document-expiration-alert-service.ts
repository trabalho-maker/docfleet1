import { createDataLayer, type DataLayer } from "@/features/data/repositories";
import type {
  FleetDocument,
  GeneratedOperationalAlertInput,
  OperationalAlert,
} from "@/features/data/types";
import { getDaysUntilDocumentDueDate } from "@/features/documents/lib/expiration";
import { createSessionDatabaseAdapter } from "@/lib/database/session-adapter";
import { getDatabaseAdapter } from "@/lib/database/provider";
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

type AlertReconciliationPlan = {
  upserts: GeneratedOperationalAlertInput[];
  deleteDocumentIds: string[];
  result: AlertReconciliationResult;
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
    return `${label} está vencido`;
  }

  if (daysUntilDue === 0) {
    return `${label} vence hoje`;
  }

  if (daysUntilDue === 1) {
    return `${label} vence amanhã`;
  }

  if (typeof daysUntilDue === "number") {
    return `${label} vence em ${daysUntilDue} dias`;
  }

  return `${label} requer atenção`;
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

function buildAlertReconciliationPlan(
  documentsRequiringAttention: FleetDocument[],
  generatedAlerts: OperationalAlert[],
  now: Date,
): AlertReconciliationPlan {
  const generatedAlertsByDocumentId = new Map(
    generatedAlerts
      .filter((alert) => Boolean(alert.sourceDocumentId))
      .map((alert) => [alert.sourceDocumentId as string, alert]),
  );
  const pendingDocumentIds = new Set(
    documentsRequiringAttention.map((document) => document.id),
  );
  const upserts: GeneratedOperationalAlertInput[] = [];
  const deleteDocumentIds: string[] = [];
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

    upserts.push(desiredAlert);

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

    deleteDocumentIds.push(alert.sourceDocumentId);
    deletedAlerts += 1;
  }

  return {
    upserts,
    deleteDocumentIds,
    result: {
      scannedDocuments: documentsRequiringAttention.length,
      scannedAlerts: generatedAlerts.length,
      createdAlerts,
      updatedAlerts,
      deletedAlerts,
      unchangedAlerts,
    },
  };
}

async function applyAlertReconciliationPlan(
  dataLayer: DataLayer,
  plan: AlertReconciliationPlan,
) {
  for (const alert of plan.upserts) {
    await dataLayer.alerts.upsertGeneratedForDocument(alert);
  }

  for (const documentId of plan.deleteDocumentIds) {
    await dataLayer.alerts.deleteGeneratedBySourceDocumentId(documentId);
  }
}

async function reconcileWithDataLayer(dataLayer: DataLayer, now: Date) {
  const [documentsRequiringAttention, generatedAlerts] = await Promise.all([
    dataLayer.documents.listRequiringAttention(now),
    dataLayer.alerts.listGenerated(),
  ]);
  const plan = buildAlertReconciliationPlan(
    documentsRequiringAttention,
    generatedAlerts,
    now,
  );

  if (plan.upserts.length > 0 || plan.deleteDocumentIds.length > 0) {
    await applyAlertReconciliationPlan(dataLayer, plan);
  }

  logger.info("alerts.document_expiration.reconciled", plan.result);

  return plan.result;
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

  if (options?.dataLayer) {
    return reconcileWithDataLayer(options.dataLayer, now);
  }

  const databaseAdapter = getDatabaseAdapter();

  return databaseAdapter.write(async (session) => {
    const scopedAdapter = createSessionDatabaseAdapter(
      databaseAdapter.provider,
      session,
    );
    const scopedDataLayer = createDataLayer({ adapter: scopedAdapter });

    return reconcileWithDataLayer(scopedDataLayer, now);
  });
}

export async function syncDocumentExpirationAlerts(options?: { now?: Date }) {
  return reconcileDocumentExpirationAlerts(options);
}

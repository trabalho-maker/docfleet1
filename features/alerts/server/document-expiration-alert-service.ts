import { createDataLayer } from "@/features/data/repositories";
import type {
  FleetDocument,
  GeneratedOperationalAlertInput,
  OperationalAlert,
} from "@/features/data/types";
import { getDaysUntilDocumentDueDate } from "@/features/documents/lib/expiration";
import { logger } from "@/lib/logger";

const URGENT_ALERT_WINDOW_DAYS = 7;

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

  if (daysUntilDue !== null && daysUntilDue <= URGENT_ALERT_WINDOW_DAYS) {
    return "Media";
  }

  return "Baixa";
}

function buildAlertTitle(document: FleetDocument, now: Date) {
  const daysUntilDue = getDaysUntilDocumentDueDate(document.dueDate, now);

  if (document.status === "Vencido" || (daysUntilDue !== null && daysUntilDue < 0)) {
    return `${document.title} esta vencido`;
  }

  if (daysUntilDue === 0) {
    return `${document.title} vence hoje`;
  }

  if (daysUntilDue === 1) {
    return `${document.title} vence amanha`;
  }

  if (typeof daysUntilDue === "number") {
    return `${document.title} vence em ${daysUntilDue} dias`;
  }

  return `${document.title} requer atencao`;
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
    team: document.owner,
    createdAt: formatAlertTimestamp(now),
    sourceDocumentId: document.id,
    kind: "document_expiration",
  };
}

export async function syncDocumentExpirationAlerts(options?: { now?: Date }) {
  const now = options?.now ?? new Date();
  const dataLayer = createDataLayer();
  const documents = await dataLayer.documents.listAll();
  const generatedAlerts = documents
    .map((document) => toGeneratedAlert(document, now))
    .filter((alert): alert is GeneratedOperationalAlertInput => Boolean(alert));

  await dataLayer.alerts.replaceGenerated(generatedAlerts);

  logger.info("alerts.document_expiration.synced", {
    documents: documents.length,
    generatedAlerts: generatedAlerts.length,
  });

  return generatedAlerts;
}

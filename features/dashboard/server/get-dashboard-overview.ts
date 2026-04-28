import { reconcileDocumentExpirationAlerts } from "@/features/alerts/server/document-expiration-alert-service";
import { SqliteAssociateRepository } from "@/features/associates/server/associate.repository";
import { getCurrentUser } from "@/features/auth/server/session";
import { createDataLayer } from "@/features/data/repositories";
import type {
  DocumentTimelineBucket,
  DocumentTypeStatusSummary,
} from "@/features/data/repositories/document-repository";
import type { DashboardOverview } from "@/features/dashboard/types";
import { getDocumentTypeLabel } from "@/features/documents/constants";

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const user = await getCurrentUser();
  await reconcileDocumentExpirationAlerts();

  const dataLayer = createDataLayer();
  const associateRepository = new SqliteAssociateRepository();
  const [
    alerts,
    totalAlerts,
    documentSummary,
    recentDocuments,
    documentsByTypeSummary,
    expirationTimelineSummary,
    totalAssociates,
  ] = await Promise.all([
    dataLayer.alerts.listRelevant(5),
    dataLayer.alerts.countRelevant(),
    dataLayer.documents.summarizeByDueDate(),
    dataLayer.documents.listRecent(8),
    dataLayer.documents.groupByType(),
    dataLayer.documents.summarizeExpirationTimeline(),
    associateRepository.countAll(),
  ]);
  const pendingDocuments =
    documentSummary.expired +
    documentSummary.dueIn15Days +
    documentSummary.dueIn30Days;
  const attentionDocuments =
    documentSummary.dueIn15Days + documentSummary.dueIn30Days;
  const expiredDocuments = documentSummary.expired;

  return {
    user,
    title: "Dashboard",
    description:
      "Visao geral com foco nas pendencias documentais e nos alertas relevantes da operacao.",
    alertCount: totalAlerts,
    recentDocuments,
    alerts,
    kpis: [
      {
        label: "Total de Documentos",
        value: documentSummary.total,
        helper: "Base documental disponivel no sistema.",
        tone: "neutral",
        icon: "documents",
      },
      {
        label: "Proximos do Vencimento",
        value: attentionDocuments,
        helper: "Documentos dentro da janela de atencao operacional.",
        tone: "warning",
        icon: "attention",
      },
      {
        label: "Documentos Vencidos",
        value: expiredDocuments,
        helper:
          expiredDocuments > 0
            ? "Acao necessaria para regularizacao."
            : "Nenhuma pendencia vencida no momento.",
        tone: "danger",
        icon: "expired",
      },
      {
        label: "Total de Associados",
        value: totalAssociates,
        helper:
          pendingDocuments > 0
            ? `${pendingDocuments} item(ns) exigem acompanhamento.`
            : "Base sem pendencias criticas abertas.",
        tone: "success",
        icon: "associates",
      },
    ],
    documentsByType: buildDocumentsByType(documentsByTypeSummary),
    expirationTimeline: buildExpirationTimeline(expirationTimelineSummary),
  };
}

function buildDocumentsByType(documents: DocumentTypeStatusSummary[]) {
  return documents.map((document) => ({
    type: getDocumentTypeLabel(document.documentType),
    valid: document.valid,
    attention: document.attention,
    expired: document.expired,
  }));
}

function buildExpirationTimeline(buckets: DocumentTimelineBucket[]) {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    timeZone: "UTC",
  });
  const points: DashboardOverview["expirationTimeline"] = [];
  const totalsByBucket = new Map(
    buckets.map((bucket) => [bucket.bucket, bucket.total]),
  );

  for (let index = -2; index <= 4; index += 1) {
    const date = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + index, 1),
    );
    const bucket = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;

    points.push({
      label: formatter
        .format(date)
        .replace(".", "")
        .replace(/^./, (value) => value.toUpperCase()),
      total: totalsByBucket.get(bucket) ?? 0,
    });
  }

  return points;
}

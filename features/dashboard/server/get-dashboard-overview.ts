import { reconcileDocumentExpirationAlerts } from "@/features/alerts/server/document-expiration-alert-service";
import { SqliteAssociateRepository } from "@/features/associates/server/associate.repository";
import { getCurrentUser } from "@/features/auth/server/session";
import { createDataLayer } from "@/features/data/repositories";
import type { FleetDocument } from "@/features/data/types";
import type { DashboardOverview } from "@/features/dashboard/types";
import { getDocumentTypeLabel } from "@/features/documents/constants";

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const user = await getCurrentUser();
  await reconcileDocumentExpirationAlerts();

  const dataLayer = createDataLayer();
  const associateRepository = new SqliteAssociateRepository();
  const [
    allDocuments,
    alerts,
    totalDocuments,
    totalAlerts,
    pendingDocuments,
    attentionDocuments,
    totalAssociates,
  ] = await Promise.all([
    dataLayer.documents.listAll(),
    dataLayer.alerts.listOpen(5),
    dataLayer.documents.countAll(),
    dataLayer.alerts.countOpen(),
    dataLayer.documents.countPending(),
    dataLayer.documents.countAttention(),
    associateRepository.countAll(),
  ]);
  const expiredDocuments = allDocuments.filter(
    (document) => document.status === "Vencido",
  ).length;

  return {
    user,
    title: "Dashboard",
    description:
      "Visão geral do sistema de documentos com leitura rápida das pendências mais importantes.",
    alertCount: totalAlerts,
    recentDocuments: allDocuments.slice(0, 8),
    alerts,
    kpis: [
      {
        label: "Total de Documentos",
        value: totalDocuments,
        helper: "Base documental disponível no sistema.",
        tone: "neutral",
        icon: "documents",
      },
      {
        label: "Próximos do Vencimento",
        value: attentionDocuments,
        helper: "Documentos dentro da janela de atenção operacional.",
        tone: "warning",
        icon: "attention",
      },
      {
        label: "Documentos Vencidos",
        value: expiredDocuments,
        helper:
          expiredDocuments > 0
            ? "Ação necessária para regularização."
            : "Nenhuma pendência vencida no momento.",
        tone: "danger",
        icon: "expired",
      },
      {
        label: "Total de Associados",
        value: totalAssociates,
        helper:
          pendingDocuments > 0
            ? `${pendingDocuments} item(ns) exigem acompanhamento.`
            : "Base sem pendências críticas abertas.",
        tone: "success",
        icon: "associates",
      },
    ],
    documentsByType: buildDocumentsByType(allDocuments),
    expirationTimeline: buildExpirationTimeline(allDocuments),
  };
}

function buildDocumentsByType(documents: FleetDocument[]) {
  const items = new Map<
    string,
    DashboardOverview["documentsByType"][number]
  >();

  for (const document of documents) {
    const typeLabel = getDocumentTypeLabel(document.documentType);
    const current = items.get(typeLabel) ?? {
      type: typeLabel,
      valid: 0,
      attention: 0,
      expired: 0,
    };

    if (document.status === "Valido") {
      current.valid += 1;
    } else if (document.status === "Atencao") {
      current.attention += 1;
    } else {
      current.expired += 1;
    }

    items.set(typeLabel, current);
  }

  return Array.from(items.values())
    .sort(
      (left, right) =>
        right.valid +
        right.attention +
        right.expired -
        (left.valid + left.attention + left.expired),
    )
    .slice(0, 5);
}

function buildExpirationTimeline(documents: FleetDocument[]) {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    timeZone: "UTC",
  });
  const points: DashboardOverview["expirationTimeline"] = [];

  for (let index = -2; index <= 4; index += 1) {
    const date = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + index, 1),
    );
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const total = documents.filter((document) => {
      const dueDate = new Date(`${document.dueDate}T00:00:00Z`);
      return (
        dueDate.getUTCFullYear() === year && dueDate.getUTCMonth() === month
      );
    }).length;

    points.push({
      label: formatter
        .format(date)
        .replace(".", "")
        .replace(/^./, (value) => value.toUpperCase()),
      total,
    });
  }

  return points;
}

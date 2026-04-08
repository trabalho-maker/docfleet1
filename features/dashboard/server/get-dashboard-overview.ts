import { getCurrentUser } from "@/features/auth/server/session";
import { createDataLayer } from "@/features/data/repositories";
import type { DashboardOverview } from "@/features/dashboard/types";

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const user = await getCurrentUser();
  const dataLayer = createDataLayer();
  const [recentDocuments, alerts, totalDocuments, totalAlerts, pendingDocuments] =
    await Promise.all([
      dataLayer.documents.listRecent(),
      dataLayer.alerts.listOpen(),
      dataLayer.documents.countAll(),
      dataLayer.alerts.countOpen(),
      dataLayer.documents.countPending(),
    ]);

  return {
    user,
    recentDocuments,
    alerts,
    metrics: [
      {
        label: "Documentos ativos",
        value: String(totalDocuments),
        helper: "Consulta real em SQLite",
      },
      {
        label: "Alertas abertos",
        value: String(totalAlerts),
        helper: "Consulta real em SQLite",
      },
      {
        label: "Pendencias criticas",
        value: String(pendingDocuments),
        helper: "Documentos com status diferente de Em dia",
      },
    ],
  };
}

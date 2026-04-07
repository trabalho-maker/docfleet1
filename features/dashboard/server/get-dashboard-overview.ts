import { getCurrentUser } from "@/features/auth/server/session";
import { createDataLayer } from "@/features/data/repositories";
import type { DashboardOverview } from "@/features/dashboard/types";

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const user = await getCurrentUser();
  const dataLayer = createDataLayer();
  const recentDocuments = await dataLayer.documents.listRecent();
  const alerts = await dataLayer.alerts.listOpen();

  return {
    user,
    recentDocuments,
    alerts,
    metrics: [
      {
        label: "Documentos ativos",
        value: String(recentDocuments.length),
        helper: "Fonte: SQLite local",
      },
      {
        label: "Alertas abertos",
        value: String(alerts.length),
        helper: "Fonte: SQLite local",
      },
      {
        label: "Pendencias criticas",
        value: String(
          recentDocuments.filter((item) => item.status !== "Em dia").length,
        ),
        helper: "Calculado na camada de dashboard",
      },
    ],
  };
}

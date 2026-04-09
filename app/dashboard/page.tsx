import type { Metadata } from "next";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { getDashboardOverview } from "@/features/dashboard/server/get-dashboard-overview";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Visao consolidada de documentos, alertas e operacao.",
};

export default async function DashboardPage() {
  const overview = await getDashboardOverview();

  return <DashboardShell overview={overview} />;
}

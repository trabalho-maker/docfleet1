import type { Metadata } from "next";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { getDashboardOverview } from "@/features/dashboard/server/get-dashboard-overview";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Visao consolidada de documentos, alertas e operacao.",
};

export default async function DashboardPage() {
  const overview = await getDashboardOverview();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 px-6 py-10 sm:px-10 lg:px-12 lg:py-16">
      <DashboardShell overview={overview} />
    </main>
  );
}

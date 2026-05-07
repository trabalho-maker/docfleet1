import { AppShell } from "@/features/dashboard/components/app-shell";
import { DashboardAlertCenter } from "@/features/dashboard/components/dashboard-alert-center";
import { DashboardChartsSection } from "@/features/dashboard/components/dashboard-charts-section";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { DashboardKpiGrid } from "@/features/dashboard/components/dashboard-kpi-grid";
import { DashboardNotificationFab } from "@/features/dashboard/components/dashboard-notification-fab";
import { UpcomingDocumentsTable } from "@/features/dashboard/components/upcoming-documents-table";
import type { DashboardOverview } from "@/features/dashboard/types";

type DashboardShellProps = {
  overview: DashboardOverview;
};

export function DashboardShell({ overview }: DashboardShellProps) {
  return (
    <AppShell user={overview.user}>
      <div className="df-dashboard-container flex min-h-full flex-col gap-5">
        <DashboardHeader
          user={overview.user}
          title={overview.title}
          summary={overview.operationalSummary}
        />

        <DashboardKpiGrid kpis={overview.kpis} />

        <section className="grid gap-5 2xl:grid-cols-[0.92fr_1.08fr]">
          <DashboardAlertCenter
            alerts={overview.alerts}
            alertCount={overview.alertCount}
          />
          <UpcomingDocumentsTable documents={overview.recentDocuments} />
        </section>

        <DashboardChartsSection
          documentsByType={overview.documentsByType}
          expirationTimeline={overview.expirationTimeline}
        />

        <DashboardNotificationFab
          alerts={overview.alerts}
          alertCount={overview.alertCount}
        />
      </div>
    </AppShell>
  );
}

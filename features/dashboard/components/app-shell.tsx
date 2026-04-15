import type { ReactNode } from "react";
import type { AuthUser } from "@/features/auth/types";
import { DashboardSidebar } from "@/features/dashboard/components/dashboard-sidebar";

type AppShellProps = {
  user: AuthUser;
  children: ReactNode;
};

export function AppShell({ user, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#0F172A]">
      <div className="grid min-h-screen lg:grid-cols-[280px_minmax(0,1fr)]">
        <DashboardSidebar user={user} />

        <main className="min-w-0 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="df-page-container min-w-0">{children}</div>
        </main>
      </div>
    </div>
  );
}

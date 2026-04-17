import type { ReactNode } from "react";
import type { AuthUser } from "@/features/auth/types";
import { DashboardSidebar } from "@/features/dashboard/components/dashboard-sidebar";

type AppShellProps = {
  user: AuthUser;
  children: ReactNode;
};

export function AppShell({ user, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F8FAFC_0%,#EEF2F7_100%)] text-[#0F172A]">
      <div className="grid min-h-screen md:grid-cols-[88px_minmax(0,1fr)] xl:grid-cols-[248px_minmax(0,1fr)]">
        <DashboardSidebar user={user} />

        <main className="min-w-0 px-4 py-4 sm:px-5 sm:py-5 lg:px-5 lg:py-5 xl:px-6 xl:py-6">
          <div className="df-page-container min-w-0">{children}</div>
        </main>
      </div>
    </div>
  );
}

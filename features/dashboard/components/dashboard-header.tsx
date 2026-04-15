import Link from "next/link";
import type { AuthUser } from "@/features/auth/types";
import { AuthenticatedPageHeader } from "@/features/dashboard/components/authenticated-page-header";

type DashboardHeaderProps = {
  user: AuthUser;
};

export function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <AuthenticatedPageHeader
      eyebrow="Dashboard operacional"
      title={`Olá, ${user.name}`}
      description="Visão consolidada da operação documental com dados reais de documentos, vencimentos, associados e alertas conectados ao core atual do DocFleet."
      userName={user.name}
      userEmail={user.email}
      userRole={user.role}
      supportingText="Sessão autenticada com Auth.js e JWT."
      actions={
        <>
          <Link href="/documentos" className="df-button-secondary">
            Abrir documentos
          </Link>
          <Link href="/associados" className="df-button-secondary">
            Abrir associados
          </Link>
        </>
      }
    />
  );
}

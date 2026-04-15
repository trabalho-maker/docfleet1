"use client";

import Link from "next/link";
import { AuthenticatedPageHeader } from "@/features/dashboard/components/authenticated-page-header";

type DocumentManagerHeaderProps = {
  userName: string;
  userEmail: string;
  userRole: string;
};

export function DocumentManagerHeader({
  userName,
  userEmail,
  userRole,
}: DocumentManagerHeaderProps) {
  return (
    <AuthenticatedPageHeader
      eyebrow="Gestão documental"
      title="Documentos operacionais"
      description="Crie, edite e acompanhe documentos com persistência em SQLite, rotas protegidas e uma visão clara do que exige ação imediata."
      userName={userName}
      userEmail={userEmail}
      userRole={userRole}
      supportingText="Área conectada ao core documental, às permissões do usuário e às rotas protegidas do DocFleet."
      actions={
        <Link href="/dashboard" className="df-button-secondary">
          Voltar ao dashboard
        </Link>
      }
    />
  );
}

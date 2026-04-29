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
      description="Acompanhe vencimentos estruturados por associado, filtre por categoria operacional e mantenha a leitura documental em uma única base."
      userName={userName}
      userEmail={userEmail}
      userRole={userRole}
      supportingText="Área conectada ao cadastro complementar dos associados, aos alertas de expiração e ao dashboard documental do DocFleet."
      actions={
        <Link href="/dashboard" className="df-button-secondary">
          Voltar ao dashboard
        </Link>
      }
    />
  );
}

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
      title="Documentos"
      userName={userName}
      userEmail={userEmail}
      userRole={userRole}
      actions={
        <Link href="/dashboard" className="df-button-secondary">
          Voltar ao dashboard
        </Link>
      }
    />
  );
}

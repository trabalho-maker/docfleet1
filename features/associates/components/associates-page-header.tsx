import type { ReactNode } from "react";
import { AuthenticatedPageHeader } from "@/features/dashboard/components/authenticated-page-header";

type AssociatesPageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  userName: string;
  userEmail: string;
  userRole: string;
  action?: ReactNode;
};

export function AssociatesPageHeader({
  eyebrow,
  title,
  description,
  userName,
  userEmail,
  userRole,
  action,
}: AssociatesPageHeaderProps) {
  return (
    <AuthenticatedPageHeader
      eyebrow={eyebrow}
      title={title}
      description={description}
      userName={userName}
      userEmail={userEmail}
      userRole={userRole}
      supportingText="Painel operacional conectado à base de associados, filtros e alertas do DocFleet."
      actions={action}
    />
  );
}

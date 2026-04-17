import type { ReactNode } from "react";
import { AuthenticatedPageHeader } from "@/features/dashboard/components/authenticated-page-header";

type AssociatesPageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  userName: string;
  userEmail: string;
  userRole: string;
  supportingText?: string;
  action?: ReactNode;
  headerClassName?: string;
  bodyClassName?: string;
  titleBlockClassName?: string;
  titleClassName?: string;
  contextPanelClassName?: string;
  userNameClassName?: string;
  userEmailClassName?: string;
  supportingTextClassName?: string;
  actionsRowClassName?: string;
  roleBadgeClassName?: string;
  contextContent?: ReactNode;
};

export function AssociatesPageHeader({
  eyebrow,
  title,
  description,
  userName,
  userEmail,
  userRole,
  supportingText,
  action,
  headerClassName,
  bodyClassName,
  titleBlockClassName,
  titleClassName,
  contextPanelClassName,
  userNameClassName,
  userEmailClassName,
  supportingTextClassName,
  actionsRowClassName,
  roleBadgeClassName,
  contextContent,
}: AssociatesPageHeaderProps) {
  return (
    <AuthenticatedPageHeader
      eyebrow={eyebrow}
      title={title}
      description={description}
      userName={userName}
      userEmail={userEmail}
      userRole={userRole}
      supportingText={
        supportingText ??
        "Painel operacional conectado a base de associados, filtros e alertas do DocFleet."
      }
      actions={action}
      headerClassName={headerClassName}
      bodyClassName={bodyClassName}
      titleBlockClassName={titleBlockClassName}
      titleClassName={titleClassName}
      contextPanelClassName={contextPanelClassName}
      userNameClassName={userNameClassName}
      userEmailClassName={userEmailClassName}
      supportingTextClassName={supportingTextClassName}
      actionsRowClassName={actionsRowClassName}
      roleBadgeClassName={roleBadgeClassName}
      contextContent={contextContent}
    />
  );
}

import type { ReactNode } from "react";

type AuthenticatedPageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  userName: string;
  userEmail: string;
  userRole: string;
  supportingText: string;
  actions?: ReactNode;
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

export function AuthenticatedPageHeader({
  eyebrow,
  title,
  description,
  userName,
  userEmail,
  userRole,
  supportingText,
  actions,
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
}: AuthenticatedPageHeaderProps) {
  return (
    <header className={`df-section-card px-6 py-6 lg:px-8 ${headerClassName ?? ""}`}>
      <div
        className={`flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between ${bodyClassName ?? ""}`}
      >
        <div className={`space-y-2 ${titleBlockClassName ?? ""}`}>
          {eyebrow ? <p className="df-eyebrow">{eyebrow}</p> : null}
          <div>
            <h1 className={`df-page-title ${titleClassName ?? ""}`}>{title}</h1>
            {description ? (
              <p className="df-page-description mt-2 max-w-3xl text-sm lg:text-base">
                {description}
              </p>
            ) : null}
          </div>
        </div>

        {contextContent ? (
          contextContent
        ) : (
          <div
            className={`df-surface-card flex flex-col gap-3 p-4 text-sm text-[var(--color-muted)] sm:min-w-[300px] ${contextPanelClassName ?? ""}`}
          >
            <div>
              <p
                className={`font-semibold text-[var(--color-foreground)] ${userNameClassName ?? ""}`}
              >
                {userName}
              </p>
              <p className={`mt-1 ${userEmailClassName ?? ""}`}>{userEmail}</p>
              <p className={`mt-3 text-sm leading-6 ${supportingTextClassName ?? ""}`}>
                {supportingText}
              </p>
            </div>
            <div className={`flex flex-wrap gap-3 ${actionsRowClassName ?? ""}`}>
              {actions}
              <span
                className={`df-badge-pill bg-[#FFF7ED] text-[#C2410C] ${roleBadgeClassName ?? ""}`}
              >
                {userRole}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

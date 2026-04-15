import type { ReactNode } from "react";

type AuthenticatedPageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  userName: string;
  userEmail: string;
  userRole: string;
  supportingText: string;
  actions?: ReactNode;
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
}: AuthenticatedPageHeaderProps) {
  return (
    <header className="df-section-card px-6 py-6 lg:px-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="df-eyebrow">{eyebrow}</p>
          <div>
            <h1 className="df-page-title">{title}</h1>
            <p className="df-page-description mt-2 max-w-3xl text-sm lg:text-base">
              {description}
            </p>
          </div>
        </div>

        <div className="df-surface-card flex flex-col gap-3 p-4 text-sm text-[var(--color-muted)] sm:min-w-[300px]">
          <div>
            <p className="font-semibold text-[var(--color-foreground)]">{userName}</p>
            <p className="mt-1">{userEmail}</p>
            <p className="mt-3 text-sm leading-6">{supportingText}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {actions}
            <span className="df-badge-pill bg-[#FFF7ED] text-[#C2410C]">
              {userRole}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

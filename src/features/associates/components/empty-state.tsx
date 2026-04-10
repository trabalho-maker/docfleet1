import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-[24px] border border-dashed border-[var(--color-border)] bg-white/70 px-6 py-8 text-center">
      <p className="text-lg font-semibold text-[var(--color-foreground)]">{title}</p>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
        {description}
      </p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

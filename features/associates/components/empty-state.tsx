import type { ReactNode } from "react";

type EmptyStateProps = {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({
  eyebrow = "Estado vazio",
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-dashed border-[#D7DEE7] bg-[linear-gradient(135deg,#F8FAFC_0%,#FFFFFF_55%,#FFF7ED_100%)] px-6 py-8 text-center shadow-[0_12px_32px_rgba(15,23,42,0.04)]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl border border-white/80 bg-white/80 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
        <span className="h-3.5 w-3.5 rounded-full bg-[#F59E0B]" aria-hidden="true" />
      </div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-[#64748B]">
        {eyebrow}
      </p>
      <p className="mt-3 text-lg font-semibold text-[#0F172A]">{title}</p>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#64748B]">
        {description}
      </p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

import type { AssociateStatus } from "@/src/features/associates/types";

type AssociateStatusBadgeProps = {
  status: AssociateStatus;
};

export function AssociateStatusBadge({ status }: AssociateStatusBadgeProps) {
  const tone = {
    Ativo: "border border-emerald-200 bg-emerald-50 text-emerald-700",
    Inativo: "border border-slate-200 bg-slate-100 text-slate-700",
    Suspenso: "border border-amber-200 bg-amber-50 text-amber-700",
    Bloqueado: "border border-red-200 bg-red-50 text-red-700",
  }[status];

  return (
    <span
      className={`inline-flex min-w-[92px] items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${tone}`}
    >
      {status}
    </span>
  );
}

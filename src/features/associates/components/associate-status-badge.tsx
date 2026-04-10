import type { AssociateStatus } from "@/src/features/associates/types";

type AssociateStatusBadgeProps = {
  status: AssociateStatus;
};

export function AssociateStatusBadge({ status }: AssociateStatusBadgeProps) {
  const tone = {
    Ativo: "bg-[#DCFCE7] text-[#166534]",
    Inativo: "bg-slate-100 text-slate-700",
    Suspenso: "bg-[#FEF3C7] text-[#92400E]",
    Bloqueado: "bg-[#FEE2E2] text-[#991B1B]",
  }[status];

  return (
    <span
      className={`inline-flex min-w-[96px] items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${tone}`}
    >
      {status}
    </span>
  );
}

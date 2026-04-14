import type { DocumentStatus } from "@/features/data/types";

type DocumentStatusBadgeProps = {
  status: DocumentStatus;
};

export function DocumentStatusBadge({ status }: DocumentStatusBadgeProps) {
  const tone = {
    Valido: "bg-emerald-100 text-emerald-700",
    Atencao: "bg-amber-100 text-amber-700",
    Vencido: "bg-red-100 text-red-700",
  }[status];

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>
      {status}
    </span>
  );
}

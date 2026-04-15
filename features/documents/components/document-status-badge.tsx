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
  const label = {
    Valido: "Válido",
    Atencao: "Atenção",
    Vencido: "Vencido",
  }[status];

  return (
    <span className={`df-badge-pill ${tone}`}>
      {label}
    </span>
  );
}

import type { DashboardOverview } from "@/features/dashboard/types";

type StatusBadgeProps = {
  status: DashboardOverview["recentDocuments"][number]["status"];
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const tone = {
    Valido: "bg-[#DCFCE7] text-[#166534]",
    Atencao: "bg-[#FEF3C7] text-[#92400E]",
    Vencido: "bg-[#FEE2E2] text-[#991B1B]",
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

import type { DashboardOverview } from "@/features/dashboard/types";

type SeverityBadgeProps = {
  severity: DashboardOverview["alerts"][number]["severity"];
};

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const tone = {
    Alta: "bg-[#FEE2E2] text-[#991B1B]",
    Media: "bg-[#FEF3C7] text-[#92400E]",
    Baixa: "bg-[#DCFCE7] text-[#166534]",
  }[severity];
  const label = {
    Alta: "Alta",
    Media: "Média",
    Baixa: "Baixa",
  }[severity];

  return (
    <span className={`df-badge-pill ${tone}`}>
      {label}
    </span>
  );
}

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

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>
      {severity}
    </span>
  );
}

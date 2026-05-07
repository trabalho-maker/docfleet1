import Link from "next/link";
import type { AuthUser } from "@/features/auth/types";
import type { DashboardOperationalSummary } from "@/features/dashboard/types";

type DashboardHeaderProps = {
  user: AuthUser;
  title: string;
  summary: DashboardOperationalSummary;
};

export function DashboardHeader({
  user,
  title,
  summary,
}: DashboardHeaderProps) {
  const headline = buildOperationalHeadline(summary);
  const support = buildOperationalSupport(summary);
  const summaryChips = buildSummaryChips(summary);

  return (
    <header className="df-section-card overflow-hidden px-5 py-5 sm:px-6 lg:px-7 xl:px-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-[2rem] font-semibold tracking-tight text-[#163559] sm:text-[2.35rem]">
            {title}
          </h1>

          <div className="mt-4 flex flex-wrap gap-2.5">
            {summaryChips.map((chip) => (
              <OperationalChip
                key={chip.label}
                label={chip.label}
                tone={chip.tone}
              />
            ))}
          </div>
        </div>

        <div className="xl:w-[min(27rem,100%)] xl:shrink-0">
          <div className="rounded-[26px] border border-[#E2E8F0] bg-[#F8FAFC] p-4 shadow-[0_14px_32px_rgba(15,23,42,0.05)]">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#163559]">
                Situação da operação
              </p>
              <p className="mt-2 text-sm font-medium text-[#0F172A]">
                {headline}
              </p>
              <p className="mt-1 text-sm leading-6 text-[#64748B]">
                {support}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E8F0] pt-4">
              <Link href="/documentos" className="df-button-secondary">
                Abrir documentos
              </Link>

              <div className="flex min-w-0 items-center gap-3 rounded-full border border-[#E2E8F0] bg-white py-2 pl-2 pr-3 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#1E3A5F] text-sm font-semibold text-white">
                  {getUserInitials(user.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#163559]">
                    {user.name}
                  </p>
                  <p className="truncate text-xs text-[#64748B]">{user.role}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function buildOperationalHeadline(summary: DashboardOperationalSummary) {
  if (summary.expiredDocuments > 0) {
    return `${summary.expiredDocuments} documento(s) vencido(s) exigem ação imediata.`;
  }

  if (summary.attentionDocuments > 0) {
    return `${summary.attentionDocuments} documento(s) exigem atenção nos próximos dias.`;
  }

  return "A base documental está regular no período atual.";
}

function buildOperationalSupport(summary: DashboardOperationalSummary) {
  if (summary.alertCount > 0) {
    return `${summary.alertCount} alerta(s) relevante(s) seguem monitorados para a rotina operacional.`;
  }

  return `${summary.totalAssociates} associado(s) seguem acompanhados na base atual.`;
}

function buildSummaryChips(summary: DashboardOperationalSummary) {
  return [
    {
      label: `${summary.totalDocuments} documentos monitorados`,
      tone: "neutral" as const,
    },
    {
      label:
        summary.attentionDocuments > 0
          ? `${summary.attentionDocuments} próximos do vencimento`
          : "Sem vencimentos próximos",
      tone: summary.attentionDocuments > 0 ? ("warning" as const) : ("success" as const),
    },
    {
      label:
        summary.expiredDocuments > 0
          ? `${summary.expiredDocuments} vencidos`
          : "Sem pendências vencidas",
      tone: summary.expiredDocuments > 0 ? ("danger" as const) : ("success" as const),
    },
    {
      label: `${summary.totalAssociates} associados acompanhados`,
      tone: "neutral" as const,
    },
  ];
}

function OperationalChip({
  label,
  tone,
}: {
  label: string;
  tone: "neutral" | "warning" | "danger" | "success";
}) {
  const palette =
    tone === "danger"
      ? "border-[#FECACA] bg-[#FFF1F2] text-[#B91C1C]"
      : tone === "warning"
        ? "border-[#FDE68A] bg-[#FFF7D6] text-[#B45309]"
        : tone === "success"
          ? "border-[#BBF7D0] bg-[#ECFDF3] text-[#15803D]"
          : "border-[#D7DEE7] bg-white text-[#35577E]";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold tracking-[0.04em] ${palette}`}
    >
      {label}
    </span>
  );
}

function getUserInitials(name: string) {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "DF";
}

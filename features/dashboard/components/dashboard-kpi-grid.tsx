import type { DashboardKpi } from "@/features/dashboard/types";

type DashboardKpiGridProps = {
  kpis: DashboardKpi[];
};

export function DashboardKpiGrid({ kpis }: DashboardKpiGridProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.label} kpi={kpi} />
      ))}
    </section>
  );
}

function KpiCard({ kpi }: { kpi: DashboardKpi }) {
  const tone = getKpiTone(kpi.tone);

  return (
    <article
      className={`rounded-[26px] border px-5 py-5 shadow-[0_16px_36px_rgba(15,23,42,0.05)] transition-transform hover:-translate-y-0.5 sm:px-6 sm:py-5 ${tone.wrapper}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-[#334155]">{kpi.label}</p>
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] ${tone.badge}`}
            >
              {tone.badgeLabel}
            </span>
          </div>
          <p className="mt-3 text-[2.5rem] font-semibold tracking-[-0.05em] text-[#163559] sm:text-[2.9rem]">
            {kpi.value}
          </p>
          <p className={`mt-2 max-w-[18rem] text-sm leading-6 ${tone.helper}`}>
            {kpi.helper}
          </p>
        </div>

        <span
          className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tone.iconBg}`}
          aria-hidden="true"
        >
          <KpiIcon icon={kpi.icon} className={tone.iconText} />
        </span>
      </div>
    </article>
  );
}

function getKpiTone(tone: DashboardKpi["tone"]) {
  if (tone === "warning") {
    return {
      wrapper: "border-[#FDE68A] bg-[#FFFBEF]",
      badge: "bg-[#FEF3C7] text-[#B45309]",
      badgeLabel: "Atenção",
      iconBg: "bg-[#FEF3C7]",
      iconText: "text-[#D97706]",
      helper: "text-[#B45309]",
    };
  }

  if (tone === "danger") {
    return {
      wrapper: "border-[#FECACA] bg-[#FFF5F5] shadow-[0_18px_42px_rgba(239,68,68,0.08)]",
      badge: "bg-[#FEE2E2] text-[#B91C1C]",
      badgeLabel: "Crítico",
      iconBg: "bg-[#FEE2E2]",
      iconText: "text-[#DC2626]",
      helper: "text-[#B91C1C]",
    };
  }

  if (tone === "success") {
    return {
      wrapper: "border-[#BBF7D0] bg-[#F7FFF9]",
      badge: "bg-[#DCFCE7] text-[#15803D]",
      badgeLabel: "Estável",
      iconBg: "bg-[#DCFCE7]",
      iconText: "text-[#16A34A]",
      helper: "text-[#15803D]",
    };
  }

  return {
    wrapper: "border-[#DBEAFE] bg-white",
    badge: "bg-[#EEF4FB] text-[#35577E]",
    badgeLabel: "Base",
    iconBg: "bg-[#EAF2FB]",
    iconText: "text-[#35577E]",
    helper: "text-[#64748B]",
  };
}

function KpiIcon({
  icon,
  className,
}: {
  icon: DashboardKpi["icon"];
  className: string;
}) {
  if (icon === "attention") {
    return <ClockStatusIcon className={className} />;
  }

  if (icon === "expired") {
    return <AlertTriangleIcon className={className} />;
  }

  if (icon === "associates") {
    return <AssociatesIcon className={className} />;
  }

  return <DocumentsIcon className={className} />;
}

function DocumentsIcon({ className }: { className: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`h-6 w-6 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2v-13a2.5 2.5 0 0 1 2-2.5Z" />
      <path d="M14 3.5V8h4" />
      <path d="M9 12h6M9 16h6" />
    </svg>
  );
}

function ClockStatusIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function AlertTriangleIcon({
  className = "h-4 w-4",
}: {
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 4 3 20h18L12 4Z" />
      <path d="M12 10v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function AssociatesIcon({ className }: { className: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`h-6 w-6 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 19a4 4 0 0 0-8 0" />
      <circle cx="12" cy="9" r="3.2" />
      <path d="M20 18a3.2 3.2 0 0 0-2.3-3.1" />
      <path d="M6.3 14.9A3.2 3.2 0 0 0 4 18" />
    </svg>
  );
}

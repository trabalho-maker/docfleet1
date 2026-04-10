type MetricCardData = {
  label: string;
  value: string | number;
  helper?: string;
};

type MetricCardProps = {
  metric: MetricCardData;
};

export function MetricCard({ metric }: MetricCardProps) {
  const accent = getMetricAccent(metric.label);

  return (
    <article className="relative overflow-hidden rounded-[28px] border border-[#E5E7EB] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.04)]">
      <div
        className={`absolute inset-x-0 top-0 h-1.5 ${accent.barClass}`}
        aria-hidden="true"
      />
      <div
        className={`absolute right-[-24px] top-[-28px] h-24 w-24 rounded-full blur-2xl ${accent.glowClass}`}
        aria-hidden="true"
      />

      <p className="relative text-sm font-semibold uppercase tracking-[0.18em] text-[#64748B]">
        {metric.label}
      </p>
      <p className="relative mt-4 text-4xl font-semibold tracking-tight text-[#0F172A]">
        {metric.value}
      </p>
      {metric.helper ? (
        <p className="relative mt-3 text-sm leading-6 text-[#64748B]">
          {metric.helper}
        </p>
      ) : null}
    </article>
  );
}

function getMetricAccent(label: string) {
  if (label.includes("Alertas")) {
    return {
      barClass: "bg-[#EAB308]",
      glowClass: "bg-amber-100/80",
    };
  }

  if (label.includes("Pendencias")) {
    return {
      barClass: "bg-[#EF4444]",
      glowClass: "bg-rose-100/80",
    };
  }

  return {
    barClass: "bg-[#22C55E]",
    glowClass: "bg-emerald-100/80",
  };
}

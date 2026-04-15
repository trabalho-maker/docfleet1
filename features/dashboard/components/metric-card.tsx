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
    <article className="df-metric-card p-6 transition-transform duration-200 hover:-translate-y-0.5">
      <div
        className={`absolute inset-x-0 top-0 h-1.5 ${accent.barClass}`}
        aria-hidden="true"
      />
      <div
        className={`absolute right-[-24px] top-[-28px] h-24 w-24 rounded-full blur-2xl ${accent.glowClass}`}
        aria-hidden="true"
      />

      <div className="relative space-y-3">
        <p className="df-eyebrow">{metric.label}</p>
        <p className="text-4xl font-semibold tracking-tight text-[var(--color-foreground)]">
          {metric.value}
        </p>
        {metric.helper ? (
          <p className="max-w-xs text-sm leading-6 text-[var(--color-muted)]">
            {metric.helper}
          </p>
        ) : null}
      </div>
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

  if (label.includes("Pendencias") || label.includes("Pendências")) {
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

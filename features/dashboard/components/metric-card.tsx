import type { DashboardMetric } from "@/features/data/types";

type MetricCardProps = {
  metric: DashboardMetric;
};

export function MetricCard({ metric }: MetricCardProps) {
  return (
    <article className="rounded-[28px] border border-[var(--color-border)] bg-white/90 p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
        {metric.label}
      </p>
      <p className="mt-4 text-4xl font-semibold text-[var(--color-foreground)]">
        {metric.value}
      </p>
      <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
        {metric.helper}
      </p>
    </article>
  );
}

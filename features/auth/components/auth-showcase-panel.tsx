"use client";

type AuthShowcasePanelProps = {
  badge: string;
  title: string;
  description: string;
  panelEyebrow: string;
  panelTitle: string;
  panelDescription: string;
  metricLabel: string;
  metricValue: string;
  stats: Array<{
    value: string;
    label: string;
  }>;
  rows: Array<{
    title: string;
    meta: string;
    tone: "orange" | "sky" | "emerald";
  }>;
};

export function AuthShowcasePanel({
  badge,
  title,
  description,
  panelEyebrow,
  panelTitle,
  panelDescription,
  metricLabel,
  metricValue,
  stats,
  rows,
}: AuthShowcasePanelProps) {
  return (
    <section className="relative overflow-hidden px-6 py-10 text-white sm:px-10 lg:px-14 lg:py-14">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.32),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.25),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.18),transparent_22%)]" />
      <div className="relative flex h-full flex-col justify-between gap-10">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur">
            <DocFleetMark />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-100/80">
              DocFleet
            </p>
            <h1 className="text-xl font-semibold tracking-tight">
              Gestao documental inteligente
            </h1>
          </div>
        </div>

        <div className="max-w-xl space-y-6">
          <div className="inline-flex items-center rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm text-blue-50/90 backdrop-blur">
            {badge}
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              {title}
            </h2>
            <p className="max-w-2xl text-lg leading-8 text-blue-50/78">
              {description}
            </p>
          </div>
        </div>

        <div className="relative max-w-xl overflow-hidden rounded-[32px] border border-white/12 bg-white/10 p-6 shadow-[0_30px_80px_rgba(2,6,23,0.32)] backdrop-blur">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.28),transparent_20%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.2),transparent_24%)]" />
          <div className="relative space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-100/70">
                  {panelEyebrow}
                </p>
                <p className="mt-2 text-2xl font-semibold">{panelTitle}</p>
              </div>
              <div className="hidden rounded-2xl border border-white/10 bg-slate-950/20 px-4 py-3 text-right sm:block">
                <p className="text-xs uppercase tracking-[0.22em] text-blue-100/60">
                  {metricLabel}
                </p>
                <p className="mt-1 text-2xl font-semibold">{metricValue}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-[28px] border border-white/10 bg-slate-950/28 p-5">
                <div>
                  <p className="text-sm font-semibold text-white/90">{panelTitle}</p>
                  <p className="mt-1 text-sm text-blue-100/60">{panelDescription}</p>
                </div>
                <div className="mt-5 space-y-3">
                  {rows.map((row) => (
                    <StatusRow
                      key={row.title}
                      title={row.title}
                      meta={row.meta}
                      tone={row.tone}
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/8 p-5">
                <p className="text-sm font-semibold text-white/90">Camada de governanca</p>
                <div className="mt-4 space-y-4">
                  <div className="rounded-2xl bg-white/8 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-blue-100/55">
                      {metricLabel}
                    </p>
                    <p className="mt-2 text-3xl font-semibold">{metricValue}</p>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-orange-400 to-sky-400" />
                  </div>
                  <p className="text-sm leading-6 text-blue-100/68">
                    Ambientes com controle centralizado ganham mais previsibilidade,
                    seguranca e menos retrabalho operacional.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {stats.map((stat) => (
                <InfoStat key={stat.label} value={stat.value} label={stat.label} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DocFleetMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 48"
      className="h-7 w-7 text-white"
      fill="none"
    >
      <path
        d="M11 12.5A4.5 4.5 0 0 1 15.5 8h12.2a4.5 4.5 0 0 1 3.182 1.318l6.8 6.8A4.5 4.5 0 0 1 39 19.3v13.2A7.5 7.5 0 0 1 31.5 40h-16A4.5 4.5 0 0 1 11 35.5v-23Z"
        stroke="currentColor"
        strokeWidth="2.2"
      />
      <path d="M29 8.5V17h8.5" stroke="currentColor" strokeWidth="2.2" />
      <path
        d="M17 25h16M17 31h10"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StatusRow({
  title,
  meta,
  tone,
}: {
  title: string;
  meta: string;
  tone: "orange" | "sky" | "emerald";
}) {
  const dotColor = {
    orange: "bg-orange-400",
    sky: "bg-sky-400",
    emerald: "bg-emerald-400",
  }[tone];

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/6 px-4 py-3">
      <span className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white/92">{title}</p>
        <p className="text-sm text-blue-100/58">{meta}</p>
      </div>
    </div>
  );
}

function InfoStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-4">
      <p className="text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-sm text-blue-100/62">{label}</p>
    </div>
  );
}

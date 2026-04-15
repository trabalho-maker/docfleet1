"use client";

import Image from "next/image";

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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.24),transparent_22%),radial-gradient(circle_at_78%_18%,rgba(59,130,246,0.2),transparent_20%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.16),transparent_22%)]" />

      <div className="relative flex h-full flex-col justify-between gap-14">
        <div className="flex flex-col items-start gap-5">
          <Image
            src="/logo-docfleet.svg"
            alt="DocFleet"
            width={620}
            height={310}
            priority
            className="h-auto w-[360px] drop-shadow-[0_20px_38px_rgba(15,23,42,0.22)] sm:w-[470px] lg:w-[590px]"
          />
          <p className="max-w-lg text-sm font-medium tracking-[0.08em] text-blue-100/72 sm:text-base">
            Gestão documental inteligente para uma operação mais previsível.
          </p>
        </div>

        <div className="max-w-2xl space-y-8">
          <div className="inline-flex items-center rounded-full border border-white/14 bg-white/8 px-4 py-2 text-sm text-blue-50/90 backdrop-blur-sm">
            {badge}
          </div>
          <div className="space-y-5">
            <h2 className="max-w-3xl text-4xl font-semibold leading-[1.01] tracking-tight text-white sm:text-5xl lg:text-[4.1rem]">
              {title}
            </h2>
            <p className="max-w-2xl text-lg leading-8 text-blue-50/78">
              {description}
            </p>
          </div>
        </div>

        <div className="relative max-w-[760px] overflow-hidden rounded-[34px] border border-white/10 bg-white/6 p-6 shadow-[0_34px_90px_rgba(2,6,23,0.28)] backdrop-blur-md lg:p-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.22),transparent_18%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.14),transparent_20%)]" />

          <div className="relative space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="max-w-xl">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-100/62">
                  {panelEyebrow}
                </p>
                <p className="mt-3 text-[1.75rem] font-semibold leading-tight text-white">
                  {panelTitle}
                </p>
              </div>

              <div className="hidden rounded-[24px] border border-white/10 bg-slate-950/18 px-4 py-3 text-right shadow-[0_12px_28px_rgba(2,6,23,0.16)] sm:block">
                <p className="text-[0.7rem] uppercase tracking-[0.22em] text-blue-100/56">
                  {metricLabel}
                </p>
                <p className="mt-1 text-2xl font-semibold text-white">{metricValue}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-[26px] border border-white/8 bg-slate-950/22 p-5">
                <div>
                  <p className="text-sm font-semibold text-white/92">{panelTitle}</p>
                  <p className="mt-2 text-sm leading-6 text-blue-100/60">
                    {panelDescription}
                  </p>
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

              <div className="rounded-[26px] border border-white/8 bg-white/6 p-5">
                <p className="text-sm font-semibold text-white/92">Camada de governança</p>
                <div className="mt-4 space-y-4">
                  <div className="rounded-2xl bg-white/8 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-blue-100/52">
                      {metricLabel}
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-white">{metricValue}</p>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-orange-400 to-sky-400" />
                  </div>

                  <p className="text-sm leading-6 text-blue-100/66">
                    Ambientes com controle centralizado ganham mais previsibilidade,
                    segurança e menos retrabalho operacional.
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
    <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/6 px-4 py-3 transition-colors duration-200 hover:bg-white/8">
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
    <div className="rounded-2xl border border-white/8 bg-white/6 px-4 py-4 transition-colors duration-200 hover:bg-white/8">
      <p className="text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-sm text-blue-100/62">{label}</p>
    </div>
  );
}

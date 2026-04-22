import type { ReactNode } from "react";

export type ModuleHeaderMetric = {
  label: string;
  value: number | string;
};

type ModuleHeaderProps = {
  title: string;
  metrics: ModuleHeaderMetric[];
  actions?: ReactNode;
  badge?: string;
};

export function ModuleHeader({
  title,
  metrics,
  actions,
  badge = "Modulo ativo",
}: ModuleHeaderProps) {
  return (
    <header className="df-section-card border-transparent bg-[linear-gradient(135deg,#173450_0%,#1E3A5F_55%,#29476B_100%)] px-6 py-6 shadow-[0_24px_55px_rgba(15,23,42,0.22)] lg:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
        <div className="max-w-[26rem]">
          <h1 className="df-page-title text-[2.9rem] font-bold uppercase tracking-[-0.06em] text-[#F3A81D] sm:text-[3.45rem] lg:text-[4rem]">
            {title}
          </h1>
        </div>

        <div className="min-w-0 rounded-[30px] border border-white/10 bg-white/6 p-5 text-white shadow-none backdrop-blur-md sm:min-w-[390px] sm:p-6 lg:max-w-[460px]">
          <div className="flex flex-col gap-5">
            {badge ? (
              <div className="flex items-start justify-end">
                <span className="inline-flex items-center rounded-full border border-[#F3A81D]/25 bg-[#F3A81D]/14 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#FFD38A]">
                  {badge}
                </span>
              </div>
            ) : null}

            <div className="grid gap-3 pt-1 sm:grid-cols-3">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-[20px] border border-white/8 bg-slate-950/16 px-4 py-3"
                >
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white/52">
                    {metric.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>

            {actions ? (
              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-start">
                {actions}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

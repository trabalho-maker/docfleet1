import type { DashboardOverview } from "@/features/dashboard/types";
import { AppShell } from "@/features/dashboard/components/app-shell";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { EmptyState } from "@/features/dashboard/components/empty-state";
import { MetricCard } from "@/features/dashboard/components/metric-card";
import { SeverityBadge } from "@/features/dashboard/components/severity-badge";
import { StatusBadge } from "@/features/dashboard/components/status-badge";

type DashboardShellProps = {
  overview: DashboardOverview;
};

export function DashboardShell({ overview }: DashboardShellProps) {
  return (
    <AppShell user={overview.user}>
      <div className="flex min-h-full flex-col gap-6">
        <DashboardHeader user={overview.user} />

        <section className="grid gap-5 xl:grid-cols-3">
          {overview.metrics.map((metric) => (
            <MetricCard key={metric.label} metric={metric} />
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <article className="df-section-card overflow-hidden p-6 lg:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="df-eyebrow">Documentos recentes</p>
                <h3 className="mt-2 text-[2rem] font-semibold tracking-tight text-[#0F172A]">
                  Operação documental
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#64748B]">
                  Itens mais relevantes da camada operacional atual, com status,
                  proprietário e vencimento prontos para acompanhamento.
                </p>
              </div>
              <div className="rounded-[24px] border border-[#FED7AA] bg-[#FFF7ED] px-4 py-3 text-sm text-[#9A3412] shadow-[0_12px_28px_rgba(249,115,22,0.08)]">
                <p className="font-semibold">Atualização em tempo real</p>
                <p className="mt-1 text-[#C2410C]">
                  Dados vindos diretamente do overview.
                </p>
              </div>
            </div>

            <div className="mt-7 grid gap-4">
              {overview.recentDocuments.length === 0 ? (
                <EmptyState
                  title="Nenhum documento recente"
                  description="Assim que houver documentos cadastrados, eles aparecem aqui com status, responsável e vencimento."
                />
              ) : (
                overview.recentDocuments.map((document) => (
                  <article
                    key={document.id}
                    className="rounded-[28px] border border-[#E5E7EB] bg-[linear-gradient(180deg,#FCFDFE_0%,#FFFFFF_100%)] p-5 shadow-[0_14px_34px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <h4 className="text-lg font-semibold text-[#0F172A]">
                            {document.name}
                          </h4>
                          <StatusBadge status={document.status} />
                        </div>
                        <p className="text-sm text-[#64748B]">
                          {document.type} · {document.owner}
                        </p>
                      </div>

                      <div className="rounded-[22px] border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#64748B] shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
                        <p className="font-semibold text-[#0F172A]">Vencimento</p>
                        <p className="mt-1">{formatDate(document.dueDate)}</p>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </article>

          <div className="grid gap-6">
            <article className="df-section-card p-6 lg:p-7">
              <p className="df-eyebrow">Alertas operacionais</p>
              <h3 className="mt-2 text-[2rem] font-semibold tracking-tight text-[#0F172A]">
                Painel de atenção
              </h3>
              <p className="mt-3 text-sm leading-6 text-[#64748B]">
                Prioridades abertas para times e responsáveis que exigem visibilidade
                imediata.
              </p>

              <div className="mt-6 grid gap-4">
                {overview.alerts.length === 0 ? (
                  <EmptyState
                    title="Sem alertas ativos"
                    description="Quando surgirem vencimentos ou pendências, o painel passa a destacar aqui o que precisa de atenção."
                  />
                ) : (
                  overview.alerts.map((alert) => (
                    <article
                      key={alert.id}
                      className="rounded-[24px] border border-[#E5E7EB] bg-[linear-gradient(180deg,#FCFDFE_0%,#FFFFFF_100%)] p-4 shadow-[0_12px_28px_rgba(15,23,42,0.03)]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-base font-semibold text-[#0F172A]">
                            {alert.title}
                          </p>
                          <p className="mt-2 text-sm text-[#64748B]">
                            {alert.team}
                          </p>
                        </div>
                        <SeverityBadge severity={alert.severity} />
                      </div>
                      <p className="mt-3 text-sm text-[#64748B]">
                        {formatDateTime(alert.createdAt)}
                      </p>
                    </article>
                  ))
                )}
              </div>
            </article>

            <article className="overflow-hidden rounded-[32px] border border-[#E5E7EB] bg-[linear-gradient(135deg,#FFF7ED_0%,#FFFFFF_52%,#F8FAFC_100%)] p-6 shadow-[0_18px_40px_rgba(15,23,42,0.04)] lg:p-7">
              <p className="df-eyebrow">Resumo executivo</p>
              <h3 className="mt-2 text-[2rem] font-semibold tracking-tight text-[#0F172A]">
                Visão do ambiente
              </h3>
              <p className="mt-3 text-sm leading-6 text-[#64748B]">
                Leitura rápida dos indicadores mais importantes para a operação atual.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
                {overview.metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-[24px] border border-white/70 bg-white/85 px-4 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.03)]"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748B]">
                      {metric.label}
                    </p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-[#0F172A]">
                      {metric.value}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#64748B]">
                      {metric.helper}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function formatDate(date: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: "UTC",
      dateStyle: "medium",
    }).format(new Date(`${date}T00:00:00Z`));
  } catch {
    return date;
  }
}

function formatDateTime(date: string) {
  const normalized = date.includes("T") ? date : date.replace(" ", "T");

  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(normalized));
  } catch {
    return date;
  }
}

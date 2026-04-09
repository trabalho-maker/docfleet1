import type { DashboardOverview } from "@/features/dashboard/types";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { DashboardSidebar } from "@/features/dashboard/components/dashboard-sidebar";
import { MetricCard } from "@/features/dashboard/components/metric-card";

type DashboardShellProps = {
  overview: DashboardOverview;
};

export function DashboardShell({ overview }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#0F172A]">
      <div className="grid min-h-screen lg:grid-cols-[280px_minmax(0,1fr)]">
        <DashboardSidebar user={overview.user} />

        <main className="min-w-0 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="flex min-h-full flex-col gap-6">
            <DashboardHeader user={overview.user} />

            <section className="grid gap-5 xl:grid-cols-3">
              {overview.metrics.map((metric) => (
                <MetricCard key={metric.label} metric={metric} />
              ))}
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
              <article className="rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.04)] lg:p-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#64748B]">
                      Documentos recentes
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[#0F172A]">
                      Operacao documental
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[#64748B]">
                      Itens mais relevantes carregados da camada atual do dashboard.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#FFF7ED] px-4 py-3 text-sm text-[#9A3412]">
                    <p className="font-semibold">Atualizacao em tempo real</p>
                    <p className="mt-1 text-[#C2410C]">
                      Dados vindos diretamente do overview.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4">
                  {overview.recentDocuments.length === 0 ? (
                    <EmptyState
                      title="Nenhum documento recente"
                      description="Assim que houver documentos cadastrados, eles aparecem aqui com status e vencimento."
                    />
                  ) : (
                    overview.recentDocuments.map((document) => (
                      <article
                        key={document.id}
                        className="rounded-[26px] border border-[#E5E7EB] bg-[#FCFDFE] p-5 transition-colors hover:bg-white"
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

                          <div className="rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#64748B]">
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
                <article className="rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.04)] lg:p-7">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#64748B]">
                    Alertas operacionais
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[#0F172A]">
                    Painel de atencao
                  </h3>

                  <div className="mt-6 grid gap-4">
                    {overview.alerts.length === 0 ? (
                      <EmptyState
                        title="Sem alertas ativos"
                        description="Quando surgirem vencimentos ou pendencias, o painel passa a destacar aqui."
                      />
                    ) : (
                      overview.alerts.map((alert) => (
                        <article
                          key={alert.id}
                          className="rounded-[24px] border border-[#E5E7EB] bg-[#FCFDFE] p-4"
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

                <article className="overflow-hidden rounded-[32px] border border-[#E5E7EB] bg-[linear-gradient(135deg,#FFF7ED_0%,#FFFFFF_55%,#F8FAFC_100%)] p-6 shadow-[0_18px_40px_rgba(15,23,42,0.04)] lg:p-7">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#64748B]">
                    Resumo executivo
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[#0F172A]">
                    Visao do ambiente
                  </h3>
                  <div className="mt-6 grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
                    {overview.metrics.map((metric) => (
                      <div
                        key={metric.label}
                        className="rounded-[24px] border border-white/70 bg-white/80 px-4 py-4"
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
        </main>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: DashboardOverview["recentDocuments"][number]["status"] }) {
  const tone = {
    Valido: "bg-[#DCFCE7] text-[#166534]",
    Atencao: "bg-[#FEF3C7] text-[#92400E]",
    Vencido: "bg-[#FEE2E2] text-[#991B1B]",
  }[status];

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>
      {status}
    </span>
  );
}

function SeverityBadge({
  severity,
}: {
  severity: DashboardOverview["alerts"][number]["severity"];
}) {
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

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[24px] border border-dashed border-[#D7DEE7] bg-[#F8FAFC] px-5 py-6">
      <p className="text-base font-semibold text-[#0F172A]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[#64748B]">{description}</p>
    </div>
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

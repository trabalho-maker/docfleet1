import Link from "next/link";
import { AssociatesPageHeader } from "@/features/associates/components/associates-page-header";
import { AssociateStatusBadge } from "@/features/associates/components/associate-status-badge";
import { FeedbackAlert } from "@/features/associates/components/feedback-alert";
import type { AuthUser } from "@/features/auth/types";
import { MetricCard } from "@/features/dashboard/components/metric-card";
import { AppShell } from "@/features/dashboard/components/app-shell";
import { getAssociateOperationConfig } from "@/features/associates/operations/constants";
import { AssociateOperationStatusBadge } from "@/features/associates/operations/components/associate-operation-status-badge";
import type {
  AssociateOperationOverview,
  AssociateOperationType,
} from "@/features/associates/operations/types";

type AssociateOperationPageProps = {
  user: AuthUser;
  operationType: AssociateOperationType;
  overview: AssociateOperationOverview;
  canView: boolean;
  accessMessage?: string | null;
};

export function AssociateOperationPage({
  user,
  operationType,
  overview,
  canView,
  accessMessage = null,
}: AssociateOperationPageProps) {
  const config = getAssociateOperationConfig(operationType);

  return (
    <AppShell user={user}>
      <div className="flex w-full flex-1 flex-col gap-6 py-2 sm:py-4">
        <AssociatesPageHeader
          eyebrow={config.eyebrow}
          title={config.title}
          description={config.description}
          userName={user.name}
          userEmail={user.email}
          userRole={user.role}
          action={
            <Link href="/associados" className="df-button-secondary">
              Abrir base de associados
            </Link>
          }
        />

        {!canView ? (
          <FeedbackAlert
            type="error"
            title="Acesso negado"
            message={accessMessage ?? "Seu perfil não pode acessar esta operação."}
          />
        ) : null}

        {canView ? (
          <>
            <section className="grid gap-5 xl:grid-cols-3">
              <MetricCard
                metric={{
                  label: "Vinculados",
                  value: overview.metrics.totalAssociates,
                  helper: "Associados atualmente vinculados a esta operação.",
                }}
              />
              <MetricCard
                metric={{
                  label: "Em atenção",
                  value: overview.metrics.attention,
                  helper:
                    "Cadastros com requisito próximo do vencimento e que pedem acompanhamento.",
                }}
              />
              <MetricCard
                metric={{
                  label: "Críticos",
                  value: overview.metrics.critical,
                  helper:
                    "Cadastros vencidos ou com requisito operacional ainda pendente.",
                }}
              />
            </section>

            <section className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
              <article className="df-section-card p-6 lg:p-7">
                <p className="df-eyebrow">Arquitetura da Sprint 4</p>
                <h2 className="mt-2 text-[1.8rem] font-semibold tracking-tight text-[var(--color-foreground)]">
                  {config.summaryTitle}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                  {config.summaryDescription}
                </p>

                <div className="mt-6 space-y-3">
                  {config.requirements.map((requirement) => (
                    <div
                      key={requirement.key}
                      className="df-surface-card px-4 py-4"
                    >
                      <p className="text-sm font-semibold text-[var(--color-foreground)]">
                        {requirement.label}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                        Regra isolada no perfil operacional, sem duplicar o cadastro
                        base de associados nem misturar a categoria sindical com o
                        tipo de operação.
                      </p>
                    </div>
                  ))}
                </div>
              </article>

              <article className="df-section-card p-6 lg:p-7">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="df-eyebrow">Visão operacional</p>
                    <h2 className="mt-2 text-[1.8rem] font-semibold tracking-tight text-[var(--color-foreground)]">
                      Associados da categoria
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                      Cada rota usa o mesmo núcleo de associados e aplica apenas as
                      regras específicas do tipo operacional selecionado.
                    </p>
                  </div>
                  <span className="df-badge-pill bg-[#FFF7ED] text-[#C2410C]">
                    {overview.entries.length} registro(s)
                  </span>
                </div>

                <div className="mt-6 grid gap-4">
                  {overview.entries.length === 0 ? (
                    <FeedbackAlert
                      type="info"
                      title="Nenhum associado vinculado ainda"
                      message="A base da Sprint 4 já está pronta. O próximo passo pode incluir formulário ou ação administrativa para vincular associados a esta operação."
                    />
                  ) : (
                    overview.entries.map((entry) => (
                      <article
                        key={entry.associate.id}
                        className="rounded-[26px] border border-[var(--color-border)] bg-[linear-gradient(180deg,#FCFDFE_0%,#FFFFFF_100%)] p-5 shadow-[0_12px_28px_rgba(15,23,42,0.03)]"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-3">
                              <p className="text-lg font-semibold text-[var(--color-foreground)]">
                                {entry.associate.name}
                              </p>
                              <AssociateOperationStatusBadge
                                status={entry.overallStatus}
                              />
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <AssociateStatusBadge status={entry.associate.status} />
                              <span className="df-badge-pill bg-slate-100 text-slate-700">
                                {entry.associate.category}
                              </span>
                              <span className="df-badge-pill bg-slate-100 text-slate-700">
                                {entry.associate.registrationNumber}
                              </span>
                            </div>
                          </div>

                          <Link href="/associados" className="df-button-secondary">
                            Ver cadastro base
                          </Link>
                        </div>

                        <div className="mt-5 grid gap-3 md:grid-cols-2">
                          {entry.requirements.map((requirement) => (
                            <div
                              key={requirement.key}
                              className="df-surface-card px-4 py-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-[var(--color-foreground)]">
                                    {requirement.label}
                                  </p>
                                  <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                                    {requirement.dueDate
                                      ? `Vencimento em ${formatDate(requirement.dueDate)}`
                                      : "Requisito ainda não informado no perfil operacional."}
                                  </p>
                                </div>
                                <AssociateOperationStatusBadge
                                  status={requirement.status}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </article>
            </section>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}

function formatDate(date: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: "UTC",
      dateStyle: "short",
    }).format(new Date(`${date}T00:00:00Z`));
  } catch {
    return date;
  }
}

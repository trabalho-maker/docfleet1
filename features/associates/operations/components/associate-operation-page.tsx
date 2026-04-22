import Link from "next/link";
import { FeedbackAlert } from "@/features/associates/components/feedback-alert";
import type { AuthUser } from "@/features/auth/types";
import { MetricCard } from "@/features/dashboard/components/metric-card";
import { AppShell } from "@/features/dashboard/components/app-shell";
import { ModuleHeader } from "@/features/dashboard/components/module-header";
import { getAssociateOperationConfig } from "@/features/associates/operations/constants";
import { AssociateOperationDirectory } from "@/features/associates/operations/components/associate-operation-directory";
import {
  buildOperationalDuePanel,
  TAXISTA_OPERATIONAL_MONITORING_WINDOW_DAYS,
  type OperationalDuePanelData,
} from "@/features/associates/operations/lib/operational-due-panel";
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
  const isTaxistaPage = operationType === "Taxista";
  const upcomingDuePanel = isTaxistaPage
    ? buildOperationalDuePanel(overview.entries)
    : null;
  const moduleMetrics = [
    { label: "Vinculados", value: overview.metrics.totalAssociates },
    { label: "Atencao", value: overview.metrics.attention },
    { label: "Criticos", value: overview.metrics.critical },
  ];

  return (
    <AppShell user={user}>
      <div className="flex w-full flex-1 flex-col gap-6 py-2 sm:py-4">
        <ModuleHeader
          title={config.title}
          metrics={moduleMetrics}
          actions={
            <Link
              href="/associados"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#F39C12] px-5 text-sm font-semibold text-[#163559] shadow-[0_14px_32px_rgba(243,156,18,0.28)] transition-colors hover:bg-[#FFB238]"
            >
              Abrir base de associados
            </Link>
          }
        />

        {!canView ? (
          <FeedbackAlert
            type="error"
            title="Acesso negado"
            message={accessMessage ?? "Seu perfil nao pode acessar esta operacao."}
          />
        ) : null}

        {canView ? (
          <>
            <section className="grid gap-5 xl:grid-cols-3">
              <MetricCard
                metric={{
                  label: "Vinculados",
                  value: overview.metrics.totalAssociates,
                  helper: isTaxistaPage
                    ? undefined
                    : "Associados atualmente vinculados a esta operacao.",
                }}
              />
              <MetricCard
                metric={{
                  label: "Em atencao",
                  value: overview.metrics.attention,
                  helper: isTaxistaPage
                    ? undefined
                    : "Cadastros com requisito proximo do vencimento e que pedem acompanhamento.",
                }}
              />
              <MetricCard
                metric={{
                  label: "Criticos",
                  value: overview.metrics.critical,
                  helper: isTaxistaPage
                    ? undefined
                    : "Cadastros vencidos ou com requisito operacional ainda pendente.",
                }}
              />
            </section>

            <section className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
              {isTaxistaPage && upcomingDuePanel ? (
                <TaxistaDuePanel panel={upcomingDuePanel} />
              ) : (
                <article className="df-section-card p-6 lg:p-7">
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
                          tipo de operacao.
                        </p>
                      </div>
                    ))}
                  </div>
                </article>
              )}

              <AssociateOperationDirectory
                title={isTaxistaPage ? "TAXISTAS" : "Associados da categoria"}
                description={
                  isTaxistaPage
                    ? undefined
                    : `Acompanhe ${config.navigationLabel.toLowerCase()} vinculados, situacao documental e acoes operacionais em uma leitura unica.`
                }
                statusColumnLabel={
                  isTaxistaPage ? "Status da exigencia" : undefined
                }
                statusFilterLabel={
                  isTaxistaPage ? "Status da exigencia" : undefined
                }
                noRequirementsLabel={
                  isTaxistaPage ? "Sem exigencia configurada" : undefined
                }
                missingStatusLabel={
                  isTaxistaPage ? "Sem exigencia" : undefined
                }
                entries={overview.entries}
                emptyStateTitle={config.emptyStateTitle}
                emptyStateDescription={config.emptyStateDescription}
                documentsHrefBase={isTaxistaPage ? "/taxistas/cadastro" : undefined}
              />
            </section>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}

function TaxistaDuePanel({
  panel,
}: {
  panel: OperationalDuePanelData;
}) {
  const maxCount = Math.max(...panel.monthBuckets.map((bucket) => bucket.count), 1);

  return (
    <article className="df-section-card p-6 lg:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[1.8rem] font-semibold tracking-tight text-[var(--color-foreground)]">
          VENCIMENTO OPERACIONAL
        </h2>
        <span className="inline-flex items-center rounded-full bg-[#EEF4FB] px-3 py-1 text-xs font-semibold text-[#35577E]">
          {panel.totalUpcoming} em {TAXISTA_OPERATIONAL_MONITORING_WINDOW_DAYS}d
        </span>
      </div>

      {panel.totalUpcoming === 0 ? (
        <div className="mt-6 rounded-[24px] border border-dashed border-[var(--color-border)] bg-[#F8FAFC] px-5 py-12 text-center text-sm font-medium text-[var(--color-muted)]">
          Sem exigencias no periodo
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          <div className="rounded-[24px] border border-[var(--color-border)] bg-[linear-gradient(180deg,#FCFDFE_0%,#FFFFFF_100%)] px-5 py-5">
            <div className="flex min-h-[190px] items-end gap-4">
              {panel.monthBuckets.map((bucket) => {
                const height = Math.max((bucket.count / maxCount) * 144, 22);

                return (
                  <div key={bucket.key} className="flex flex-1 flex-col items-center gap-3">
                    <div className="text-sm font-semibold text-[var(--color-foreground)]">
                      {bucket.count}
                    </div>
                    <div className="flex h-36 w-full items-end rounded-[20px] bg-[#F8FAFC] px-3 pb-3">
                      <div
                        className="w-full rounded-[16px] bg-[linear-gradient(180deg,#F3A81D_0%,#F39C12_100%)] shadow-[0_10px_22px_rgba(243,156,18,0.28)]"
                        style={{ height: `${height}px` }}
                      />
                    </div>
                    <div className="text-center text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                      {bucket.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3">
            {panel.requirementBuckets.map((bucket) => (
              <div
                key={bucket.label}
                className="df-surface-card flex items-center justify-between px-4 py-4"
              >
                <p className="text-sm font-semibold text-[var(--color-foreground)]">
                  {bucket.label}
                </p>
                <span className="inline-flex min-w-10 items-center justify-center rounded-full bg-[#FFF7ED] px-3 py-1 text-sm font-semibold text-[#B45309]">
                  {bucket.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

import Link from "next/link";
import { AssociatesPageHeader } from "@/features/associates/components/associates-page-header";
import { FeedbackAlert } from "@/features/associates/components/feedback-alert";
import type { AuthUser } from "@/features/auth/types";
import { MetricCard } from "@/features/dashboard/components/metric-card";
import { AppShell } from "@/features/dashboard/components/app-shell";
import { getAssociateOperationConfig } from "@/features/associates/operations/constants";
import { AssociateOperationDirectory } from "@/features/associates/operations/components/associate-operation-directory";
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
  const taxistaHeaderContext = isTaxistaPage ? (
    <div className="min-w-0 rounded-[30px] border border-white/10 bg-white/6 p-5 text-white shadow-none backdrop-blur-md sm:min-w-[390px] sm:p-6 lg:max-w-[460px]">
      <div className="flex flex-col gap-5">
        <div className="flex items-start justify-end">
          <span className="inline-flex items-center rounded-full border border-[#F3A81D]/25 bg-[#F3A81D]/14 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#FFD38A]">
            Modulo ativo
          </span>
        </div>

        <div className="grid gap-3 pt-1 sm:grid-cols-3">
          <HeaderMetric label="Vinculados" value={overview.metrics.totalAssociates} />
          <HeaderMetric label="Atencao" value={overview.metrics.attention} />
          <HeaderMetric label="Criticos" value={overview.metrics.critical} />
        </div>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-start">
          <Link
            href="/associados"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#F39C12] px-5 text-sm font-semibold text-[#163559] shadow-[0_14px_32px_rgba(243,156,18,0.28)] transition-colors hover:bg-[#FFB238]"
          >
            Abrir base de associados
          </Link>
        </div>
      </div>
    </div>
  ) : undefined;

  return (
    <AppShell user={user}>
      <div className="flex w-full flex-1 flex-col gap-6 py-2 sm:py-4">
        <AssociatesPageHeader
          eyebrow={isTaxistaPage ? undefined : config.eyebrow}
          title={config.title}
          description={isTaxistaPage ? undefined : config.description}
          userName={user.name}
          userEmail={user.email}
          userRole={user.role}
          headerClassName={
            isTaxistaPage
              ? "border-transparent bg-[linear-gradient(135deg,#173450_0%,#1E3A5F_55%,#29476B_100%)] shadow-[0_24px_55px_rgba(15,23,42,0.22)]"
              : undefined
          }
          bodyClassName={
            isTaxistaPage ? "gap-6 lg:items-center lg:gap-10" : undefined
          }
          titleBlockClassName={isTaxistaPage ? "max-w-[26rem]" : undefined}
          titleClassName={
            isTaxistaPage
              ? "text-[#F3A81D] text-[2.9rem] font-bold tracking-[-0.06em] sm:text-[3.45rem] lg:text-[4rem]"
              : undefined
          }
          contextContent={taxistaHeaderContext}
          action={
            <Link
              href="/associados"
              className={
                isTaxistaPage
                  ? "inline-flex min-h-11 items-center justify-center rounded-full bg-[#F39C12] px-5 text-sm font-semibold text-[#163559] shadow-[0_14px_32px_rgba(243,156,18,0.28)] transition-colors hover:bg-[#FFB238]"
                  : "df-button-secondary"
              }
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
                  helper: "Associados atualmente vinculados a esta operacao.",
                }}
              />
              <MetricCard
                metric={{
                  label: "Em atencao",
                  value: overview.metrics.attention,
                  helper:
                    "Cadastros com requisito proximo do vencimento e que pedem acompanhamento.",
                }}
              />
              <MetricCard
                metric={{
                  label: "Criticos",
                  value: overview.metrics.critical,
                  helper:
                    "Cadastros vencidos ou com requisito operacional ainda pendente.",
                }}
              />
            </section>

            <section className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
              <article className="df-section-card p-6 lg:p-7">
                <h2 className="mt-2 text-[1.8rem] font-semibold tracking-tight text-[var(--color-foreground)]">
                  {config.summaryTitle}
                </h2>
                {isTaxistaPage ? null : (
                  <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                    {config.summaryDescription}
                  </p>
                )}

                <div className="mt-6 space-y-3">
                  {config.requirements.map((requirement) => (
                    <div
                      key={requirement.key}
                      className="df-surface-card px-4 py-4"
                    >
                      <p className="text-sm font-semibold text-[var(--color-foreground)]">
                        {requirement.label}
                      </p>
                      {isTaxistaPage ? null : (
                        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                          Regra isolada no perfil operacional, sem duplicar o cadastro
                          base de associados nem misturar a categoria sindical com o
                          tipo de operacao.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </article>

              <AssociateOperationDirectory
                title="Associados da categoria"
                description="Acompanhe taxistas vinculados, situacao documental e acoes operacionais em uma leitura unica."
                entries={overview.entries}
                emptyStateTitle="Nenhum taxista vinculado ainda"
                emptyStateDescription="Quando houver associados vinculados a operacao de taxi, eles aparecerao aqui com status documentais e operacionais."
              />
            </section>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}

function HeaderMetric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-[20px] border border-white/8 bg-slate-950/16 px-4 py-3">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white/52">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{value}</p>
    </div>
  );
}

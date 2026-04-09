import type { DashboardOverview } from "@/features/dashboard/types";
import Link from "next/link";
import { signOutAction } from "@/features/auth/actions/sign-out";
import { MetricCard } from "@/features/dashboard/components/metric-card";

type DashboardShellProps = {
  overview: DashboardOverview;
};

export function DashboardShell({ overview }: DashboardShellProps) {
  return (
    <div className="flex w-full flex-col gap-8">
      <section className="flex flex-col gap-4 rounded-[32px] border border-[var(--color-border)] bg-[var(--color-card)] p-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
          Dashboard
        </p>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-[var(--color-foreground)]">
              Ola, {overview.user.name}
            </h1>
            <p className="mt-2 text-base leading-7 text-[var(--color-muted)]">
              Perfil atual: {overview.user.role}. Este painel consome sessao real do Auth.js e repositorios persistidos em SQLite local, prontos para trocar por banco gerenciado depois se voce quiser.
            </p>
          </div>
          <div className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-white/80 px-5 py-4 text-sm text-[var(--color-muted)]">
            <div>
              <p className="font-semibold text-[var(--color-foreground)]">
                {overview.user.email}
              </p>
              <p>Camada ativa: `features/auth` + `features/data`</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/documentos"
                className="inline-flex h-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-white px-4 text-sm font-semibold text-[var(--color-foreground)] transition-colors duration-200 hover:bg-[var(--color-surface-strong)]"
              >
                Gerenciar documentos
              </Link>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-white px-4 text-sm font-semibold text-[var(--color-foreground)] transition-colors duration-200 hover:bg-[var(--color-surface-strong)]"
                >
                  Sair
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {overview.metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-[32px] border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
                Documentos recentes
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--color-foreground)]">
                Repositorio de documentos
              </h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            {overview.recentDocuments.map((document) => (
              <div
                key={document.id}
                className="rounded-2xl border border-[var(--color-border)] bg-white/90 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-base font-semibold text-[var(--color-foreground)]">
                      {document.name}
                    </p>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">
                      {document.type} · {document.owner}
                    </p>
                  </div>
                  <div className="text-sm text-[var(--color-muted)]">
                    <p className="font-semibold text-[var(--color-foreground)]">
                      {document.status}
                    </p>
                    <p>Vencimento: {document.dueDate}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[32px] border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Alertas operacionais
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--color-foreground)]">
            Repositorio de alertas
          </h2>

          <div className="mt-6 grid gap-4">
            {overview.alerts.map((alert) => (
              <div
                key={alert.id}
                className="rounded-2xl border border-[var(--color-border)] bg-white/90 p-4"
              >
                <p className="text-base font-semibold text-[var(--color-foreground)]">
                  {alert.title}
                </p>
                <p className="mt-2 text-sm text-[var(--color-muted)]">
                  {alert.team} · Severidade {alert.severity}
                </p>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  {alert.createdAt}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

import Link from "next/link";

export function CallToAction() {
  return (
    <section className="rounded-[32px] border border-[var(--color-border)] bg-[linear-gradient(135deg,#fff8e7_0%,#ffffff_55%,#ecfeff_100%)] p-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:p-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
            Proximo passo
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-[var(--color-foreground)]">
            A base esta pronta para receber modulos reais de autenticacao, dashboards e fluxos operacionais.
          </h2>
          <p className="text-base leading-7 text-[var(--color-muted)]">
            Use `components`, `lib` e `app` como pontos de expansao. Quando o dominio crescer, a proxima etapa natural e introduzir `features` para agrupar regras por contexto de negocio.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-full border border-[var(--color-border)] bg-white px-6 text-sm font-semibold text-[var(--color-foreground)] transition-colors duration-200 hover:bg-[var(--color-surface-strong)]"
          >
            Estrutura de auth
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--color-foreground)] px-6 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
          >
            Estrutura de dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}

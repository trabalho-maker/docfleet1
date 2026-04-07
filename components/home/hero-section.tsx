import Link from "next/link";
import { siteConfig } from "@/lib/site";

export function HeroSection() {
  return (
    <section className="grid gap-10 lg:grid-cols-[1.3fr_0.9fr] lg:items-center">
      <div className="space-y-6">
        <p className="inline-flex rounded-full border border-[var(--color-border)] bg-white/70 px-4 py-2 text-sm font-medium text-[var(--color-accent)] shadow-sm">
          Plataforma de gestao documental para operacoes e frota
        </p>
        <div className="space-y-4">
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-[var(--color-foreground)] sm:text-5xl">
            Centralize documentos, alertas e rotinas do DocFleet em uma base pronta para escalar.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-[var(--color-muted)]">
            Esta estrutura inicial organiza o projeto por responsabilidade, reduz riscos de build e deixa o app pronto para evoluir com novas features sem acumular codigo de template.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--color-accent)] px-6 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
          >
            Ver fluxo de login
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-12 items-center justify-center rounded-full border border-[var(--color-border)] bg-white px-6 text-sm font-semibold text-[var(--color-foreground)] transition-colors duration-200 hover:bg-[var(--color-surface-strong)]"
          >
            Abrir dashboard
          </Link>
        </div>
      </div>

      <div className="rounded-[32px] border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Base inicial
          </p>
          <div className="grid gap-3">
            {siteConfig.foundationItems.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-[var(--color-border)] bg-white/90 p-4"
              >
                <p className="text-base font-semibold text-[var(--color-foreground)]">
                  {item.title}
                </p>
                <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

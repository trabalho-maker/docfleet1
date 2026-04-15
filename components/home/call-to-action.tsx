import Link from "next/link";

export function CallToAction() {
  return (
    <section className="df-section-card overflow-hidden bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_52%,#fff7ed_100%)] p-8 sm:p-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-3">
          <p className="df-eyebrow text-[var(--color-accent)]">
            Próximo passo
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-[var(--color-foreground)] sm:text-[2.2rem]">
            O produto já está pronto para evoluir em cima de uma base administrativa sólida.
          </h2>
          <p className="df-page-description text-base">
            Explore o fluxo de autenticação, a operação documental e o centro de controle
            já conectados ao núcleo atual do sistema. As próximas evoluções podem seguir
            por domínio sem perder coerência visual nem estrutural.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/login" className="df-button-secondary px-6">
            Explorar acesso
          </Link>
          <Link href="/dashboard" className="df-button-primary px-6">
            Abrir dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}

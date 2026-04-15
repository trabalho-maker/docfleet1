import { siteConfig } from "@/lib/site";

export function FeatureGrid() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="df-eyebrow">
          Base consolidada
        </p>
        <h2 className="df-page-title max-w-3xl text-[2.4rem]">
          O que sustenta a evolução do DocFleet a partir desta base.
        </h2>
        <p className="df-page-description max-w-3xl">
          A estrutura já organiza autenticação, operações e persistência com clareza,
          criando uma plataforma pronta para crescer por módulos sem perder consistência.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {siteConfig.reviewActions.map((item) => (
          <article key={item.title} className="df-section-card p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
              {item.label}
            </p>
            <h3 className="mt-3 text-xl font-semibold text-[var(--color-foreground)]">
              {item.title}
            </h3>
            <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
              {item.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

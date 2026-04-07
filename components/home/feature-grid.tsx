import { siteConfig } from "@/lib/site";

export function FeatureGrid() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
          Diretrizes aplicadas
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-[var(--color-foreground)]">
          O que mudou na reorganizacao da base
        </h2>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {siteConfig.reviewActions.map((item) => (
          <article
            key={item.title}
            className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm"
          >
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

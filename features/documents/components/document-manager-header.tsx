"use client";

import Link from "next/link";

type DocumentManagerHeaderProps = {
  userName: string;
};

export function DocumentManagerHeader({
  userName,
}: DocumentManagerHeaderProps) {
  return (
    <section className="rounded-[32px] border border-[var(--color-border)] bg-[var(--color-card)] p-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
            CRUD de documentos
          </p>
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-[var(--color-foreground)]">
              Gestao documental
            </h1>
            <p className="mt-2 max-w-3xl text-base leading-7 text-[var(--color-muted)]">
              Crie, edite e exclua documentos com persistencia em SQLite e rotas
              API protegidas. Tudo conectado ao core atual do DocFleet.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-white/80 px-5 py-4 text-sm text-[var(--color-muted)]">
          <p className="font-semibold text-[var(--color-foreground)]">{userName}</p>
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-white px-4 text-sm font-semibold text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-surface-strong)]"
          >
            Voltar ao dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import { RequestPasswordResetCard } from "@/features/auth/components/request-password-reset-card";

export const metadata: Metadata = {
  title: "Recuperar senha",
  description: "Solicite um link seguro para redefinir sua senha.",
};

export default function RequestPasswordResetPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-6 py-10 sm:px-10 lg:px-12 lg:py-16">
      <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
            Recuperacao
          </p>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-[var(--color-foreground)] sm:text-5xl">
            Envie um link seguro para redefinir a senha da sua conta.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-[var(--color-muted)]">
            O fluxo usa token aleatorio com hash persistido no SQLite, validade curta e entrega por SMTP. Em desenvolvimento e E2E, o link continua disponivel em uma caixa de saida local para facilitar validacao.
          </p>
        </section>
        <RequestPasswordResetCard />
      </div>
    </main>
  );
}

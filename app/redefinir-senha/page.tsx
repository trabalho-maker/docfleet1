import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordCard } from "@/features/auth/components/reset-password-card";

export const metadata: Metadata = {
  title: "Redefinir senha",
  description: "Defina uma nova senha usando um token seguro de recuperacao.",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token ?? "";

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-6 py-10 sm:px-10 lg:px-12 lg:py-16">
      <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
            Redefinicao
          </p>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-[var(--color-foreground)] sm:text-5xl">
            Finalize a recuperacao com uma nova senha forte.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-[var(--color-muted)]">
            O token e validado no servidor, tem expiracao curta e fica inutilizado apos o uso.
          </p>
          {!token ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Token ausente ou invalido. Solicite um novo link de recuperacao em{" "}
              <Link
                href="/recuperar-senha"
                className="font-semibold text-[var(--color-accent)]"
              >
                recuperar senha
              </Link>
              .
            </div>
          ) : null}
        </section>
        {token ? <ResetPasswordCard token={token} /> : null}
      </div>
    </main>
  );
}

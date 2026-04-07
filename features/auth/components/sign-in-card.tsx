"use client";

import Link from "next/link";
import { useActionState } from "react";
import { authProviders } from "@/features/auth/constants";
import {
  signInAction,
  type SignInFormState,
} from "@/features/auth/actions/sign-in";

const initialState: SignInFormState = {};
const isDevelopment = process.env.NODE_ENV === "development";
const devSeedEmail = process.env.NEXT_PUBLIC_DEV_SEED_USER_EMAIL ?? "";
const devSeedPassword = process.env.NEXT_PUBLIC_DEV_SEED_USER_PASSWORD ?? "";

export function SignInCard() {
  const [state, formAction, isPending] = useActionState(
    signInAction,
    initialState,
  );

  return (
    <section className="rounded-[32px] border border-[var(--color-border)] bg-[var(--color-card)] p-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Feature auth
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--color-foreground)]">
            Camadas separadas para UI, sessao e providers
          </h2>
        </div>

        <div className="grid gap-4">
          {authProviders.map((provider) => (
            <article
              key={provider.id}
              className="rounded-2xl border border-[var(--color-border)] bg-white/90 p-4"
            >
              <h3 className="text-base font-semibold text-[var(--color-foreground)]">
                {provider.name}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                {provider.description}
              </p>
            </article>
          ))}
        </div>

        <form action={formAction} className="grid gap-4">
          <label className="grid gap-2 text-sm font-medium text-[var(--color-foreground)]">
            Email
            <input
              type="email"
              name="email"
              defaultValue={isDevelopment ? devSeedEmail : undefined}
              className="h-12 rounded-2xl border border-[var(--color-border)] bg-white px-4 text-base outline-none transition-colors focus:border-[var(--color-accent)]"
              autoComplete="email"
              required
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-[var(--color-foreground)]">
            Senha
            <input
              type="password"
              name="password"
              defaultValue={isDevelopment ? devSeedPassword : undefined}
              className="h-12 rounded-2xl border border-[var(--color-border)] bg-white px-4 text-base outline-none transition-colors focus:border-[var(--color-accent)]"
              autoComplete="current-password"
              required
            />
          </label>

          {state.error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {state.error}
            </p>
          ) : null}

          <button
            type="submit"
            className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[var(--color-foreground)] px-6 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending}
          >
            {isPending ? "Entrando..." : "Entrar no DocFleet"}
          </button>
        </form>

        {isDevelopment && devSeedEmail && devSeedPassword ? (
          <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-white/70 p-4">
            <p className="text-sm leading-6 text-[var(--color-muted)]">
              Credenciais de desenvolvimento: `{devSeedEmail}` / `{devSeedPassword}`.
            </p>
          </div>
        ) : null}

        <p className="text-sm text-[var(--color-muted)]">
          Ainda nao tem acesso?{" "}
          <Link
            href="/cadastro"
            className="font-semibold text-[var(--color-accent)]"
          >
            Criar conta
          </Link>
        </p>

        <p className="text-sm text-[var(--color-muted)]">
          Esqueceu a senha?{" "}
          <Link
            href="/recuperar-senha"
            className="font-semibold text-[var(--color-accent)]"
          >
            Recuperar acesso
          </Link>
        </p>
      </div>
    </section>
  );
}

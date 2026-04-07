"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  signUpAction,
  type SignUpFormState,
} from "@/features/auth/actions/sign-up";

const initialState: SignUpFormState = {};

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-red-700">{message}</p>;
}

export function SignUpCard() {
  const [state, formAction, isPending] = useActionState(
    signUpAction,
    initialState,
  );

  return (
    <section className="rounded-[32px] border border-[var(--color-border)] bg-[var(--color-card)] p-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Novo usuario
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--color-foreground)]">
            Cadastro com validacao server-side
          </h2>
        </div>

        <form action={formAction} className="grid gap-4">
          <label className="grid gap-2 text-sm font-medium text-[var(--color-foreground)]">
            Nome completo
            <input
              type="text"
              name="name"
              className="h-12 rounded-2xl border border-[var(--color-border)] bg-white px-4 text-base outline-none transition-colors focus:border-[var(--color-accent)]"
              autoComplete="name"
              required
            />
            <FieldError message={state.fieldErrors?.name} />
          </label>

          <label className="grid gap-2 text-sm font-medium text-[var(--color-foreground)]">
            Email
            <input
              type="email"
              name="email"
              className="h-12 rounded-2xl border border-[var(--color-border)] bg-white px-4 text-base outline-none transition-colors focus:border-[var(--color-accent)]"
              autoComplete="email"
              required
            />
            <FieldError message={state.fieldErrors?.email} />
          </label>

          <label className="grid gap-2 text-sm font-medium text-[var(--color-foreground)]">
            Senha
            <input
              type="password"
              name="password"
              className="h-12 rounded-2xl border border-[var(--color-border)] bg-white px-4 text-base outline-none transition-colors focus:border-[var(--color-accent)]"
              autoComplete="new-password"
              required
            />
            <FieldError message={state.fieldErrors?.password} />
          </label>

          <label className="grid gap-2 text-sm font-medium text-[var(--color-foreground)]">
            Confirmar senha
            <input
              type="password"
              name="confirmPassword"
              className="h-12 rounded-2xl border border-[var(--color-border)] bg-white px-4 text-base outline-none transition-colors focus:border-[var(--color-accent)]"
              autoComplete="new-password"
              required
            />
            <FieldError message={state.fieldErrors?.confirmPassword} />
          </label>

          {state.formError ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {state.formError}
            </p>
          ) : null}

          <button
            type="submit"
            className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[var(--color-foreground)] px-6 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending}
          >
            {isPending ? "Criando conta..." : "Criar conta"}
          </button>
        </form>

        <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-white/70 p-4">
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            Regras atuais: email valido, senha com 8+ caracteres, letra maiuscula, minuscula e numero.
          </p>
        </div>

        <p className="text-sm text-[var(--color-muted)]">
          Ja possui acesso?{" "}
          <Link href="/login" className="font-semibold text-[var(--color-accent)]">
            Entrar no sistema
          </Link>
        </p>
      </div>
    </section>
  );
}

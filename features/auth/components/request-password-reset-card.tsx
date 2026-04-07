"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  requestPasswordResetAction,
  type RequestPasswordResetState,
} from "@/features/auth/actions/request-password-reset";

const initialState: RequestPasswordResetState = {};

export function RequestPasswordResetCard() {
  const [state, formAction, isPending] = useActionState(
    requestPasswordResetAction,
    initialState,
  );

  return (
    <section className="rounded-[32px] border border-[var(--color-border)] bg-[var(--color-card)] p-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Recuperacao
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--color-foreground)]">
            Solicite um link seguro de redefinicao
          </h2>
        </div>

        <form action={formAction} className="grid gap-4">
          <label className="grid gap-2 text-sm font-medium text-[var(--color-foreground)]">
            Email
            <input
              type="email"
              name="email"
              className="h-12 rounded-2xl border border-[var(--color-border)] bg-white px-4 text-base outline-none transition-colors focus:border-[var(--color-accent)]"
              autoComplete="email"
              required
            />
          </label>

          {state.error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {state.error}
            </p>
          ) : null}

          {state.success ? (
            <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {state.success}
            </p>
          ) : null}

          {state.resetUrl ? (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-white/70 p-4 text-sm text-[var(--color-muted)]">
              <p>Link de desenvolvimento:</p>
              <p className="mt-2 break-all font-medium text-[var(--color-foreground)]">
                {state.resetUrl}
              </p>
            </div>
          ) : null}

          <button
            type="submit"
            className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[var(--color-foreground)] px-6 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending}
          >
            {isPending ? "Gerando link..." : "Enviar link de recuperacao"}
          </button>
        </form>

        <p className="text-sm text-[var(--color-muted)]">
          Lembrou a senha?{" "}
          <Link href="/login" className="font-semibold text-[var(--color-accent)]">
            Voltar ao login
          </Link>
        </p>
      </div>
    </section>
  );
}

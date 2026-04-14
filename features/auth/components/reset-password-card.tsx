"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  resetPasswordAction,
  type ResetPasswordState,
} from "@/features/auth/actions/reset-password";

const initialState: ResetPasswordState = {};

export function ResetPasswordCard({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState(
    resetPasswordAction,
    initialState,
  );

  return (
    <section className="rounded-[32px] border border-[var(--color-border)] bg-[var(--color-card)] p-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Redefinição
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--color-foreground)]">
            Defina uma nova senha segura
          </h2>
        </div>

        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="token" value={token} />

          <label className="grid gap-2 text-sm font-medium text-[var(--color-foreground)]">
            Nova senha
            <input
              type="password"
              name="password"
              className="h-12 rounded-2xl border border-[var(--color-border)] bg-white px-4 text-base outline-none transition-colors focus:border-[var(--color-accent)]"
              autoComplete="new-password"
              required
            />
            {state.fieldErrors?.password ? (
              <p className="text-sm text-red-700">{state.fieldErrors.password}</p>
            ) : null}
          </label>

          <label className="grid gap-2 text-sm font-medium text-[var(--color-foreground)]">
            Confirmar nova senha
            <input
              type="password"
              name="confirmPassword"
              className="h-12 rounded-2xl border border-[var(--color-border)] bg-white px-4 text-base outline-none transition-colors focus:border-[var(--color-accent)]"
              autoComplete="new-password"
              required
            />
            {state.fieldErrors?.confirmPassword ? (
              <p className="text-sm text-red-700">
                {state.fieldErrors.confirmPassword}
              </p>
            ) : null}
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
            {isPending ? "Redefinindo..." : "Salvar nova senha"}
          </button>
        </form>

        <p className="text-sm text-[var(--color-muted)]">
          Solicitar outro link?{" "}
          <Link
            href="/recuperar-senha"
            className="font-semibold text-[var(--color-accent)]"
          >
            Recuperar senha
          </Link>
        </p>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useActionState, useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  requestPasswordResetAction,
  type RequestPasswordResetState,
} from "@/features/auth/actions/request-password-reset";

const initialState: RequestPasswordResetState = {};

export function RequestPasswordResetCard() {
  const emailId = useId();
  const [state, formAction, isPending] = useActionState(
    requestPasswordResetAction,
    initialState,
  );

  return (
    <section className="w-full max-w-[480px] rounded-[32px] border border-slate-200/80 bg-white p-8 shadow-[0_32px_80px_rgba(15,23,42,0.14)] sm:p-10">
      <div className="space-y-8">
        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Recuperação
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              Esqueceu sua senha?
            </h2>
            <p className="text-sm leading-6 text-slate-500">
              Informe seu email para receber um link seguro de redefinição e
              voltar ao ambiente do DocFleet.
            </p>
          </div>
        </header>

        <form action={formAction} className="grid gap-5" noValidate>
          <Input
            id={emailId}
            label="Email"
            name="email"
            type="email"
            placeholder="voce@empresa.com"
            autoComplete="email"
            required
            icon={<MailIcon />}
          />

          {state.error ? (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {state.error}
            </div>
          ) : null}

          {state.success ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {state.success}
            </div>
          ) : null}

          {state.resetUrl ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              <p className="font-medium text-slate-800">Link de desenvolvimento</p>
              <p className="mt-2 break-all">{state.resetUrl}</p>
            </div>
          ) : null}

          <Button
            type="submit"
            isLoading={isPending}
            loadingLabel="Enviando link..."
          >
            Enviar link de recuperação
          </Button>
        </form>

        <div className="space-y-4">
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            O link gerado possui expiração curta e uso único para reduzir risco
            operacional.
          </div>

          <p className="text-sm text-slate-500">
            Lembrou a senha?{" "}
            <Link
              href="/login"
              className="font-semibold text-slate-900 transition-colors hover:text-[#f97316]"
            >
              Voltar ao login
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

function MailIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 6h16v12H4z" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

"use client";

import Link from "next/link";
import { useActionState, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  signUpAction,
  type SignUpFormState,
} from "@/features/auth/actions/sign-up";

const initialState: SignUpFormState = {};

export function SignUpCard() {
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();
  const [state, formAction, isPending] = useActionState(
    signUpAction,
    initialState,
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <section className="w-full max-w-[480px] rounded-[32px] border border-slate-200/80 bg-white p-8 shadow-[0_32px_80px_rgba(15,23,42,0.14)] sm:p-10">
      <div className="space-y-8">
        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Novo acesso
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              Criar usuário no DocFleet
            </h2>
            <p className="text-sm leading-6 text-slate-500">
              Use este formulário interno para provisionar um novo acesso com segurança.
            </p>
          </div>
        </header>

        {state.formError ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {state.formError}
          </div>
        ) : null}

        {state.successMessage ? (
          <div
            role="status"
            className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          >
            {state.successMessage}
          </div>
        ) : null}

        <form action={formAction} className="grid gap-5">
          <Input
            id={nameId}
            label="Nome completo"
            name="name"
            type="text"
            placeholder="Nome do usuário"
            autoComplete="name"
            required
            error={state.fieldErrors?.name}
            icon={<UserIcon />}
          />

          <Input
            id={emailId}
            label="Email"
            name="email"
            type="email"
            placeholder="usuario@empresa.com"
            autoComplete="email"
            required
            error={state.fieldErrors?.email}
            icon={<MailIcon />}
          />

          <Input
            id={passwordId}
            label="Senha"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Crie uma senha"
            autoComplete="new-password"
            required
            error={state.fieldErrors?.password}
            icon={<LockIcon />}
            trailingAction={
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="text-xs font-semibold text-slate-500 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            }
          />

          <Input
            id={confirmPasswordId}
            label="Confirmar senha"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Repita a senha"
            autoComplete="new-password"
            required
            error={state.fieldErrors?.confirmPassword}
            icon={<LockIcon />}
            trailingAction={
              <button
                type="button"
                onClick={() => setShowConfirmPassword((current) => !current)}
                className="text-xs font-semibold text-slate-500 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                aria-label={
                  showConfirmPassword
                    ? "Ocultar confirmação de senha"
                    : "Mostrar confirmação de senha"
                }
              >
                {showConfirmPassword ? "Ocultar" : "Mostrar"}
              </button>
            }
          />

          <Button
            type="submit"
            isLoading={isPending}
            loadingLabel="Criando usuário..."
          >
            Criar usuário
          </Button>
        </form>

        <div className="space-y-4">
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            Requisitos da senha:
            <span className="mt-1 block text-slate-700">
              mínimo de 8 caracteres, com letra maiúscula, minúscula e número.
            </span>
          </div>

          <p className="text-sm text-slate-500">
            Voltar para o painel?{" "}
            <Link
              href="/dashboard"
              className="font-semibold text-slate-900 transition-colors hover:text-[#f97316]"
            >
              Abrir dashboard
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

function UserIcon() {
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
      <path d="M18 21a6 6 0 0 0-12 0" />
      <circle cx="12" cy="8" r="4" />
    </svg>
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

function LockIcon() {
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
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 1 1 8 0v3" />
    </svg>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SignInCardProps = {
  resetSuccess?: boolean;
};

const isDevelopment = process.env.NODE_ENV === "development";
const devSeedEmail = process.env.NEXT_PUBLIC_DEV_SEED_USER_EMAIL ?? "";
const devSeedPassword = process.env.NEXT_PUBLIC_DEV_SEED_USER_PASSWORD ?? "";
const rememberedEmailStorageKey = "docfleet.remembered-email";

type FormErrors = {
  email?: string;
  password?: string;
  general?: string;
};

export function SignInCard({ resetSuccess = false }: SignInCardProps) {
  const router = useRouter();
  const emailId = useId();
  const passwordId = useId();
  const [email, setEmail] = useState(() => getInitialEmail());
  const [password, setPassword] = useState(isDevelopment ? devSeedPassword : "");
  const [rememberMe, setRememberMe] = useState(() => getInitialRememberMe());
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();
    const nextErrors: FormErrors = {};

    if (!trimmedEmail) {
      nextErrors.email = "Informe seu email.";
    }

    if (!password) {
      nextErrors.password = "Informe sua senha.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    if (rememberMe) {
      window.localStorage.setItem(rememberedEmailStorageKey, trimmedEmail);
    } else {
      window.localStorage.removeItem(rememberedEmailStorageKey);
    }

    const result = await signIn("credentials", {
      email: trimmedEmail,
      password,
      redirect: false,
    });

    setIsLoading(false);

    if (!result || result.error) {
      setErrors({
        general: "Email ou senha invalidos.",
      });
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <section className="w-full max-w-[480px] rounded-[32px] border border-slate-200/80 bg-white p-8 shadow-[0_32px_80px_rgba(15,23,42,0.14)] sm:p-10">
      <div className="space-y-8">
        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Area segura
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              Entrar no DocFleet
            </h2>
            <p className="text-sm leading-6 text-slate-500">
              Acesse seu painel para acompanhar vencimentos, alertas operacionais e
              documentos da frota em um unico lugar.
            </p>
          </div>
        </header>

        {resetSuccess ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Senha redefinida com sucesso. Entre com a sua nova credencial.
          </div>
        ) : null}

        {errors.general ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {errors.general}
          </div>
        ) : null}

        <form className="grid gap-5" onSubmit={handleSubmit} noValidate>
          <Input
            id={emailId}
            label="Email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="voce@empresa.com"
            autoComplete="email"
            required
            error={errors.email}
            icon={<MailIcon />}
          />

          <Input
            id={passwordId}
            label="Senha"
            name="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Sua senha"
            autoComplete="current-password"
            required
            error={errors.password}
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

          <div className="flex items-center justify-between gap-4 text-sm">
            <label className="flex items-center gap-3 text-slate-500">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-[#f97316] focus:ring-[#fdba74]"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              <span>Lembrar-me</span>
            </label>

            <Link
              href="/recuperar-senha"
              className="font-semibold text-slate-900 transition-colors hover:text-[#f97316]"
            >
              Esqueceu sua senha?
            </Link>
          </div>

          <Button type="submit" isLoading={isLoading} loadingLabel="Entrando...">
            Entrar
          </Button>
        </form>

        <div className="space-y-4">
          {isDevelopment && devSeedEmail && devSeedPassword ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              Ambiente de desenvolvimento:
              <span className="mt-1 block font-medium text-slate-800">
                {devSeedEmail} / {devSeedPassword}
              </span>
            </div>
          ) : null}

          <p className="text-sm text-slate-500">
            Ainda nao tem acesso?{" "}
            <Link
              href="/cadastro"
              className="font-semibold text-slate-900 transition-colors hover:text-[#f97316]"
            >
              Criar conta
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

function getInitialEmail() {
  if (typeof window !== "undefined") {
    return window.localStorage.getItem(rememberedEmailStorageKey) ?? devSeedEmail;
  }

  return devSeedEmail;
}

function getInitialRememberMe() {
  if (typeof window !== "undefined") {
    return Boolean(window.localStorage.getItem(rememberedEmailStorageKey));
  }

  return Boolean(isDevelopment && devSeedEmail);
}

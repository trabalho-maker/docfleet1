import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignInCard } from "@/features/auth/components/sign-in-card";

export const metadata: Metadata = {
  title: "Login",
  description: "Acesso inicial ao ambiente do DocFleet.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-6 py-10 sm:px-10 lg:px-12 lg:py-16">
      <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
            Autenticacao
          </p>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-[var(--color-foreground)] sm:text-5xl">
            Estrutura pronta para plugar provedor real de login, sessao e permissoes.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-[var(--color-muted)]">
            Esta rota agora usa `Auth.js` com credenciais reais e usuarios persistidos em SQLite local. A troca para SSO, Auth.js social login ou API corporativa continua concentrada na feature `auth`.
          </p>
          {params.reset === "success" ? (
            <div className="max-w-2xl rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Senha redefinida com sucesso. Entre com a sua nova credencial.
            </div>
          ) : null}
        </section>
        <SignInCard />
      </div>
    </main>
  );
}

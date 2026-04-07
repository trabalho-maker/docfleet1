import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignUpCard } from "@/features/auth/components/sign-up-card";

export const metadata: Metadata = {
  title: "Cadastro",
  description: "Criacao de novo acesso ao ambiente do DocFleet.",
};

export default async function SignUpPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-6 py-10 sm:px-10 lg:px-12 lg:py-16">
      <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
            Cadastro
          </p>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-[var(--color-foreground)] sm:text-5xl">
            Crie um novo usuario com validacao de email e senha antes de entrar no DocFleet.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-[var(--color-muted)]">
            O cadastro grava o usuario em SQLite local, aplica hash com `bcrypt` e reutiliza a mesma feature `auth` do fluxo de login.
          </p>
        </section>
        <SignUpCard />
      </div>
    </main>
  );
}

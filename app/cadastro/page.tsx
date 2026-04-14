import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthShowcasePanel } from "@/features/auth/components/auth-showcase-panel";
import { SignUpCard } from "@/features/auth/components/sign-up-card";

export const metadata: Metadata = {
  title: "Cadastro",
  description: "Criação de novo acesso ao ambiente do DocFleet.",
};

export default async function SignUpPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#0f172a_0%,#14213d_45%,#1d4ed8_100%)]">
      <div className="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
        <AuthShowcasePanel
          badge="Provisionamento rápido de acessos para equipes e operações"
          title="Crie um novo acesso e leve sua equipe para um fluxo mais seguro."
          description="Cadastre usuários com validação de email, senha forte e autenticação integrada ao ambiente do DocFleet sem perder o padrão operacional."
          panelEyebrow="Onboarding de acessos"
          panelTitle="Um cadastro simples, seguro e pronto para escalar."
          panelDescription="A base já valida credenciais, aplica hash com bcrypt e integra o novo usuário ao fluxo autenticado do sistema."
          metricLabel="Tempo médio"
          metricValue="< 2 min"
          rows={[
            {
              title: "Criação de conta com validação",
              meta: "nome, email e senha forte",
              tone: "orange",
            },
            {
              title: "Persistência centralizada",
              meta: "usuários gravados em SQLite",
              tone: "sky",
            },
            {
              title: "Acesso liberado imediatamente",
              meta: "entrada direta no dashboard",
              tone: "emerald",
            },
          ]}
          stats={[
            { value: "1", label: "fonte única de usuários" },
            { value: "100%", label: "senhas com hash" },
            { value: "24/7", label: "acesso ao painel" },
          ]}
        />

        <section className="flex items-center justify-center bg-[#f8fafc] px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
          <SignUpCard />
        </section>
      </div>
    </main>
  );
}

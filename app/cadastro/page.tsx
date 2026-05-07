import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/server/session";
import { canManageOperationalData } from "@/features/auth/lib/role-authorization";
import { AuthShowcasePanel } from "@/features/auth/components/auth-showcase-panel";
import { SignUpCard } from "@/features/auth/components/sign-up-card";

export const metadata: Metadata = {
  title: "Cadastro interno",
  description: "Provisionamento interno de novos acessos ao ambiente do DocFleet.",
};

export default async function SignUpPage() {
  const user = await getCurrentUser();

  if (!canManageOperationalData(user)) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#0f172a_0%,#14213d_45%,#1d4ed8_100%)]">
      <div className="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
        <AuthShowcasePanel
          badge="Provisionamento interno de acessos para equipes e operações"
          title="Crie novos acessos com segurança e mantenha o ambiente sob controle."
          description="Somente gestores autenticados podem cadastrar usuários, preservando o caráter interno do DocFleet e reduzindo exposição indevida."
          panelEyebrow="Gestão de acessos"
          panelTitle="Cadastro interno com validação forte e fluxo controlado."
          panelDescription="O novo usuário é criado com validação de dados, senha forte e persistência centralizada, sem liberar auto-cadastro público."
          metricLabel="Uso esperado"
          metricValue="Interno"
          rows={[
            {
              title: "Cadastro restrito a gestores",
              meta: "sem auto-cadastro público",
              tone: "orange",
            },
            {
              title: "Persistência centralizada",
              meta: "usuários gravados em SQLite",
              tone: "sky",
            },
            {
              title: "Acesso provisionado com controle",
              meta: "fluxo seguro para operação real",
              tone: "emerald",
            },
          ]}
          stats={[
            { value: "1", label: "fonte única de usuários" },
            { value: "100%", label: "senhas com hash" },
            { value: "0", label: "auto-cadastro público" },
          ]}
        />

        <section className="flex items-center justify-center bg-[#f8fafc] px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
          <SignUpCard />
        </section>
      </div>
    </main>
  );
}

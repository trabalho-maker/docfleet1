import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthShowcasePanel } from "@/features/auth/components/auth-showcase-panel";
import { RequestPasswordResetCard } from "@/features/auth/components/request-password-reset-card";

export const metadata: Metadata = {
  title: "Recuperar senha",
  description: "Solicite um link seguro para redefinir sua senha.",
};

export default async function RequestPasswordResetPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#0f172a_0%,#14213d_45%,#1d4ed8_100%)]">
      <div className="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
        <AuthShowcasePanel
          badge="Recuperação segura de acesso com token temporário"
          title="Recupere o acesso sem expor a segurança da sua conta."
          description="Solicite um link de redefinição com expiração curta, token protegido por hash e entrega integrada ao fluxo atual do DocFleet."
          panelEyebrow="Redefinição segura"
          panelTitle="Menos atrito para o usuário, mais previsibilidade para a operação."
          panelDescription="O link de recuperação é gerado sob demanda, enviado pelo provedor configurado e validado com uso único."
          metricLabel="Validade"
          metricValue="30 min"
          rows={[
            {
              title: "Token aleatório e temporário",
              meta: "armazenado com hash",
              tone: "orange",
            },
            {
              title: "Entrega integrada ao fluxo atual",
              meta: "SMTP real ou outbox local em dev",
              tone: "sky",
            },
            {
              title: "Uso único na redefinição",
              meta: "links antigos deixam de valer após sucesso",
              tone: "emerald",
            },
          ]}
          stats={[
            { value: "1", label: "token por solicitação" },
            { value: "100%", label: "validação no servidor" },
            { value: "24/7", label: "recuperação de acesso" },
          ]}
        />

        <section className="flex items-center justify-center bg-[#f8fafc] px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
          <RequestPasswordResetCard />
        </section>
      </div>
    </main>
  );
}

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
          badge="Recuperacao segura de acesso com token temporario"
          title="Recupere o acesso sem expor a seguranca da sua conta."
          description="Solicite um link de redefinicao com expiracao curta, token protegido por hash e entrega integrada ao fluxo atual do DocFleet."
          panelEyebrow="Redefinicao segura"
          panelTitle="Menos atrito para o usuario, mais previsibilidade para a operacao."
          panelDescription="O link de recuperacao e gerado sob demanda, enviado pelo provedor configurado e validado com uso unico."
          metricLabel="Validade"
          metricValue="30 min"
          rows={[
            {
              title: "Token aleatorio e temporario",
              meta: "armazenado com hash",
              tone: "orange",
            },
            {
              title: "Entrega integrada ao fluxo atual",
              meta: "SMTP real ou outbox local em dev",
              tone: "sky",
            },
            {
              title: "Uso unico na redefinicao",
              meta: "links antigos deixam de valer apos sucesso",
              tone: "emerald",
            },
          ]}
          stats={[
            { value: "1", label: "token por solicitacao" },
            { value: "100%", label: "validacao server-side" },
            { value: "24/7", label: "recuperacao de acesso" },
          ]}
        />

        <section className="flex items-center justify-center bg-[#f8fafc] px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
          <RequestPasswordResetCard />
        </section>
      </div>
    </main>
  );
}

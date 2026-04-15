import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthShowcasePanel } from "@/features/auth/components/auth-showcase-panel";
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
    <main className="min-h-screen bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_45%,#1e3a8a_100%)]">
      <div className="grid min-h-screen lg:grid-cols-[1.16fr_0.84fr]">
        <AuthShowcasePanel
          badge="Monitoramento de vencimentos, alertas e conformidade em tempo real"
          title="Bem-vindo de volta ao centro de controle da sua frota."
          description="Organize documentos críticos, acompanhe pendências por equipe e mantenha auditorias sob controle com uma operação mais previsível."
          panelEyebrow="Operação documental"
          panelTitle="Seus documentos, alertas e usuários em um único fluxo."
          panelDescription="Auditoria de contratos, licenças e ASOs com uma visão prática do que exige ação imediata."
          metricLabel="SLA médio"
          metricValue="98.4%"
          rows={[
            {
              title: "Licenciamento da frota leve",
              meta: "vence em 2 dias",
              tone: "orange",
            },
            {
              title: "ASO dos motoristas",
              meta: "pendente de aprovação",
              tone: "sky",
            },
            {
              title: "Contratos de manutenção",
              meta: "regularizado",
              tone: "emerald",
            },
          ]}
          stats={[
            { value: "124", label: "documentos ativos" },
            { value: "18", label: "alertas acompanhados" },
            { value: "7", label: "times conectados" },
          ]}
        />

        <section className="relative flex items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] px-6 py-10 sm:px-10 lg:px-16 lg:py-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(251,146,60,0.08),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_26%)]" />
          <div className="relative w-full max-w-[540px]">
            <SignInCard resetSuccess={params.reset === "success"} />
          </div>
        </section>
      </div>
    </main>
  );
}

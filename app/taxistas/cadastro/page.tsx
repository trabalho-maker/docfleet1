import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/features/auth/server/session";
import {
  canEditAssociate,
  canViewAssociates,
  getAssociateAccessMessage,
} from "@/features/associates/lib/associate-authorization";
import { AssociatesPageHeader } from "@/features/associates/components/associates-page-header";
import { FeedbackAlert } from "@/features/associates/components/feedback-alert";
import { AppShell } from "@/features/dashboard/components/app-shell";
import { TaxistaCadastroSection } from "@/features/taxistas/cadastro/components/taxista-cadastro-section";
import { createTaxistaCadastroService } from "@/features/taxistas/cadastro/server/taxista-cadastro.service";

export const metadata: Metadata = {
  title: "Cadastro de taxistas",
  description: "Gerenciamento operacional do cadastro do modulo TAXISTAS.",
};

type TaxistasCadastroPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TaxistasCadastroPage({
  searchParams,
}: TaxistasCadastroPageProps) {
  const user = await getCurrentUser();
  const canView = canViewAssociates(user);
  const canEdit = canEditAssociate(user);
  const accessMessage = getAssociateAccessMessage(user);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const selectedAssociateId = getSingleSearchParam(resolvedSearchParams?.taxista);
  const records = canView
    ? await createTaxistaCadastroService().listTaxistas()
    : [];

  return (
    <AppShell user={user}>
      <div className="flex w-full flex-1 flex-col gap-6 py-2 sm:py-4">
        <AssociatesPageHeader
          title="Cadastro"
          userName={user.name}
          userEmail={user.email}
          userRole={user.role}
          headerClassName="border-transparent bg-[linear-gradient(135deg,#173450_0%,#1E3A5F_55%,#29476B_100%)] shadow-[0_24px_55px_rgba(15,23,42,0.22)]"
          bodyClassName="gap-6 lg:items-center lg:gap-10"
          titleClassName="text-[#F3A81D] text-[2.4rem] font-bold tracking-[-0.05em] sm:text-[3rem]"
          action={
            <div className="flex flex-wrap gap-3">
              <Link href="/taxistas" className="df-button-secondary">
                Voltar ao modulo
              </Link>
              {canEdit ? (
                <Link href="/associados" className="df-button-secondary">
                  Base de associados
                </Link>
              ) : null}
            </div>
          }
        />

        {!canView ? (
          <FeedbackAlert
            type="error"
            title="Acesso negado"
            message={accessMessage ?? "Seu perfil nao pode acessar o cadastro de taxistas."}
          />
        ) : null}

        {canView ? (
          <TaxistaCadastroSection
            user={user}
            records={records}
            initialSelectedAssociateId={selectedAssociateId}
          />
        ) : null}
      </div>
    </AppShell>
  );
}

function getSingleSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

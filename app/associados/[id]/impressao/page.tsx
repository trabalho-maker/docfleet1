import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/features/auth/server/session";
import { PrintAssociateActions } from "@/features/associates/components/print-associate-actions";
import { PrintableAssociateSheet } from "@/features/associates/components/printable-associate-sheet";
import { FeedbackAlert } from "@/features/associates/components/feedback-alert";
import {
  canViewAssociates,
  getAssociateAccessMessage,
} from "@/features/associates/lib/associate-authorization";
import {
  AssociateNotFoundError,
  createAssociateService,
} from "@/features/associates/server/associate.service";

export const metadata: Metadata = {
  title: "Ficha de associado",
  description: "Visualização institucional para impressão da ficha do associado.",
};

type PrintAssociatePageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    autoPrint?: string;
  }>;
};

export default async function PrintAssociatePage({
  params,
  searchParams,
}: PrintAssociatePageProps) {
  const user = await getCurrentUser();
  const canView = canViewAssociates(user);
  const accessMessage = getAssociateAccessMessage(user);

  if (!canView) {
    return (
      <main className="df-page-container flex min-h-screen w-full flex-1 items-center px-6 py-10 sm:px-10">
        <div className="w-full max-w-3xl">
          <FeedbackAlert
            type="error"
            title="Acesso negado"
            message={accessMessage ?? "Seu perfil não pode acessar a ficha do associado."}
          />
        </div>
      </main>
    );
  }

  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const associateService = createAssociateService();
  let associate;

  try {
    associate = await associateService.getAssociateById(id);
  } catch (error) {
    if (error instanceof AssociateNotFoundError) {
      notFound();
    }

    throw error;
  }

  return (
    <main className="print-sheet-root mx-auto flex w-full max-w-[980px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <PrintAssociateActions
        associateId={associate.id}
        autoPrint={resolvedSearchParams?.autoPrint === "1"}
      />
      <PrintableAssociateSheet
        associate={associate}
        logoSrc="/logo-sintrarc-header-cropped.png"
      />
    </main>
  );
}

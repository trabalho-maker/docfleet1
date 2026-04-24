import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/features/auth/server/session";
import { FeedbackAlert } from "@/features/associates/components/feedback-alert";
import {
  canEditAssociate,
  getAssociateAccessMessage,
} from "@/features/associates/lib/associate-authorization";
import {
  AssociateNotFoundError,
  createAssociateService,
} from "@/features/associates/server/associate.service";
import { createDataLayer } from "@/features/data/repositories";
import { AssociateDocumentsSection } from "@/features/documents/components/associate-documents-section";
import { associateDocumentTypes } from "@/features/documents/constants";
import type { AssociateDocumentFormValues } from "@/features/documents/types";

export const metadata: Metadata = {
  title: "Documentos do associado",
  description: "Cadastro complementar de vencimentos documentais do associado.",
};

type AssociateDocumentsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function buildInitialValues(): AssociateDocumentFormValues {
  return Object.fromEntries(
    associateDocumentTypes.map((documentType) => [documentType, ""]),
  ) as AssociateDocumentFormValues;
}

export default async function AssociateDocumentsPage({
  params,
}: AssociateDocumentsPageProps) {
  const user = await getCurrentUser();
  const canEdit = canEditAssociate(user);
  const accessMessage = getAssociateAccessMessage(user);

  if (!canEdit) {
    return (
      <main className="mx-auto flex w-full max-w-7xl flex-1 px-6 py-10 sm:px-10 lg:px-12 lg:py-16">
        <div className="w-full">
          <FeedbackAlert
            type="error"
            message={accessMessage ?? "Seu perfil nao pode editar associados."}
          />
        </div>
      </main>
    );
  }

  const { id } = await params;
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

  const documents = await createDataLayer().documents.findByAssociateId(associate.id, {
    documentTypes: [...associateDocumentTypes],
  });
  const initialValues = buildInitialValues();

  for (const document of documents) {
    if (document.documentType in initialValues) {
      initialValues[document.documentType as keyof AssociateDocumentFormValues] =
        document.dueDate;
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 px-6 py-10 sm:px-10 lg:px-12 lg:py-16">
      <AssociateDocumentsSection
        associateId={associate.id}
        associateName={associate.name}
        associateRegistrationNumber={associate.registrationNumber}
        associateCategoryLabel={
          associate.modalidadeAssociado ?? "Sem modalidade"
        }
        initialValues={initialValues}
        userName={user.name}
        userEmail={user.email}
        userRole={user.role}
      />
    </main>
  );
}

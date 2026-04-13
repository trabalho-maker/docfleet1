import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/features/auth/server/session";
import { FeedbackAlert } from "@/src/features/associates/components/feedback-alert";
import { EditAssociateSection } from "@/src/features/associates/components/edit-associate-section";
import {
  canEditAssociate,
  getAssociateAccessMessage,
} from "@/src/features/associates/lib/associate-authorization";
import {
  AssociateNotFoundError,
  createAssociateService,
} from "@/src/features/associates/server/associate.service";

export const metadata: Metadata = {
  title: "Editar associado",
  description: "Edicao de associados cadastrados no DocFleet.",
};

type EditAssociatePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditAssociatePage({
  params,
}: EditAssociatePageProps) {
  const user = await getCurrentUser();
  const canEdit = canEditAssociate(user);
  const accessMessage = getAssociateAccessMessage(user);

  if (!canEdit) {
    return (
      <main className="mx-auto flex w-full max-w-7xl flex-1 px-6 py-10 sm:px-10 lg:px-12 lg:py-16">
        <div className="w-full">
          <FeedbackAlert
            type="error"
            message={accessMessage ?? "Seu perfil não pode editar associados."}
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

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 px-6 py-10 sm:px-10 lg:px-12 lg:py-16">
      <EditAssociateSection
        associateId={associate.id}
        initialValues={{
          name: associate.name,
          cpf: associate.cpf,
          category: associate.category,
          registrationNumber: associate.registrationNumber,
          status: associate.status,
          admissionDate: associate.admissionDate,
        }}
        userName={user.name}
        userEmail={user.email}
      />
    </main>
  );
}

import type { Metadata } from "next";
import { getCurrentUser } from "@/features/auth/server/session";
import { FeedbackAlert } from "@/features/associates/components/feedback-alert";
import { CreateAssociateSection } from "@/features/associates/components/create-associate-section";
import {
  canCreateAssociate,
  getAssociateAccessMessage,
} from "@/features/associates/lib/associate-authorization";

export const metadata: Metadata = {
  title: "Novo associado",
  description: "Cadastro de novos associados no DocFleet.",
};

export default async function NewAssociatePage() {
  const user = await getCurrentUser();
  const canCreate = canCreateAssociate(user);
  const accessMessage = getAssociateAccessMessage(user);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 px-6 py-10 sm:px-10 lg:px-12 lg:py-16">
      {canCreate ? (
        <CreateAssociateSection userName={user.name} userEmail={user.email} />
      ) : (
        <div className="w-full">
          <FeedbackAlert
            type="error"
            message={accessMessage ?? "Seu perfil nÃ£o pode cadastrar associados."}
          />
        </div>
      )}
    </main>
  );
}


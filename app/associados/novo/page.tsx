import type { Metadata } from "next";
import { getCurrentUser } from "@/features/auth/server/session";
import { CreateAssociateSection } from "@/src/features/associates/components/create-associate-section";

export const metadata: Metadata = {
  title: "Novo associado",
  description: "Cadastro de novos associados no DocFleet.",
};

export default async function NewAssociatePage() {
  const user = await getCurrentUser();

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 px-6 py-10 sm:px-10 lg:px-12 lg:py-16">
      <CreateAssociateSection userName={user.name} userEmail={user.email} />
    </main>
  );
}

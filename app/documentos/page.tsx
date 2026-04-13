import type { Metadata } from "next";
import {
  canManageOperationalData,
  canViewOperationalData,
} from "@/features/auth/lib/role-authorization";
import { getCurrentUser } from "@/features/auth/server/session";
import { DocumentManager } from "@/features/documents/components/document-manager";

export const metadata: Metadata = {
  title: "Documentos",
  description: "CRUD completo de documentos do DocFleet.",
};

export default async function DocumentsPage() {
  const user = await getCurrentUser();
  const canViewDocuments = canViewOperationalData(user);
  const canManageDocuments = canManageOperationalData(user);
  const accessMessage = canViewDocuments
    ? canManageDocuments
      ? null
      : "Seu perfil pode consultar documentos, mas não pode criar, editar ou excluir registros."
    : "Seu perfil não tem permissão para acessar o módulo de documentos.";

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 px-6 py-10 sm:px-10 lg:px-12 lg:py-16">
      <DocumentManager
        userName={user.name}
        canViewDocuments={canViewDocuments}
        canManageDocuments={canManageDocuments}
        accessMessage={accessMessage}
      />
    </main>
  );
}

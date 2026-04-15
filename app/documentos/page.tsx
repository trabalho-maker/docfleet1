import type { Metadata } from "next";
import {
  canManageOperationalData,
  canViewOperationalData,
} from "@/features/auth/lib/role-authorization";
import { getCurrentUser } from "@/features/auth/server/session";
import { AppShell } from "@/features/dashboard/components/app-shell";
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
    <AppShell user={user}>
      <div className="flex w-full flex-1 py-2 sm:py-4">
        <DocumentManager
          userName={user.name}
          userEmail={user.email}
          userRole={user.role}
          canViewDocuments={canViewDocuments}
          canManageDocuments={canManageDocuments}
          accessMessage={accessMessage}
        />
      </div>
    </AppShell>
  );
}

import type { Metadata } from "next";
import { getCurrentUser } from "@/features/auth/server/session";
import { DocumentManager } from "@/features/documents/components/document-manager";

export const metadata: Metadata = {
  title: "Documentos",
  description: "CRUD completo de documentos do DocFleet.",
};

export default async function DocumentsPage() {
  const user = await getCurrentUser();

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 px-6 py-10 sm:px-10 lg:px-12 lg:py-16">
      <DocumentManager userName={user.name} />
    </main>
  );
}

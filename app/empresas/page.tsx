import type { Metadata } from "next";
import { getCurrentUser } from "@/features/auth/server/session";
import {
  canViewAssociates,
  getAssociateAccessMessage,
} from "@/features/associates/lib/associate-authorization";
import { AssociateOperationPage } from "@/features/associates/operations/components/associate-operation-page";
import { createAssociateOperationService } from "@/features/associates/operations/server/associate-operation.service";
import { createEmptyAssociateOperationOverview } from "@/features/associates/operations/types";

export const metadata: Metadata = {
  title: "Empresas",
  description: "Visão operacional de empresas associadas no DocFleet.",
};

export default async function EmpresasPage() {
  const user = await getCurrentUser();
  const canView = canViewAssociates(user);
  const accessMessage = getAssociateAccessMessage(user);
  const overview = canView
    ? await createAssociateOperationService().getOperationOverview("Empresa")
    : createEmptyAssociateOperationOverview("Empresa");

  return (
    <AssociateOperationPage
      user={user}
      operationType="Empresa"
      overview={overview}
      canView={canView}
      accessMessage={accessMessage}
    />
  );
}

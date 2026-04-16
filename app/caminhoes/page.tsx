import type { Metadata } from "next";
import { getCurrentUser } from "@/features/auth/server/session";
import {
  canViewAssociates,
  getAssociateAccessMessage,
} from "@/features/associates/lib/associate-authorization";
import { AssociateOperationPage } from "@/features/associates/operations/components/associate-operation-page";
import { createAssociateOperationService } from "@/features/associates/operations/server/associate-operation.service";

export const metadata: Metadata = {
  title: "Caminhões",
  description: "Visão operacional de caminhões no DocFleet.",
};

export default async function TrucksPage() {
  const user = await getCurrentUser();
  const canView = canViewAssociates(user);
  const accessMessage = getAssociateAccessMessage(user);
  const overview = canView
    ? await createAssociateOperationService().getOperationOverview("Caminhao")
    : {
        operationType: "Caminhao" as const,
        entries: [],
        metrics: {
          totalAssociates: 0,
          valid: 0,
          attention: 0,
          critical: 0,
        },
      };

  return (
    <AssociateOperationPage
      user={user}
      operationType="Caminhao"
      overview={overview}
      canView={canView}
      accessMessage={accessMessage}
    />
  );
}

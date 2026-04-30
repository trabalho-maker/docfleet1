import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/features/auth/server/session";
import { FeedbackAlert } from "@/features/associates/components/feedback-alert";
import {
  canEditAssociate,
  canViewAssociates,
  getAssociateAccessMessage,
} from "@/features/associates/lib/associate-authorization";
import { AppShell } from "@/features/dashboard/components/app-shell";
import { MembershipFeeSection } from "@/features/membership-fees/components/membership-fee-section";
import {
  createMembershipFeeService,
  MembershipFeeNotFoundError,
  MembershipFeeValidationError,
} from "@/features/membership-fees/server/membership-fee.service";

export const metadata: Metadata = {
  title: "Mensalidades do associado",
  description: "Controle financeiro anual do associado no DocFleet.",
};

type MembershipFeesPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    year?: string;
  }>;
};

export default async function MembershipFeesPage({
  params,
  searchParams,
}: MembershipFeesPageProps) {
  const user = await getCurrentUser();
  const canView = canViewAssociates(user);
  const canEdit = canEditAssociate(user);
  const accessMessage = getAssociateAccessMessage(user);

  if (!canView) {
    return (
      <AppShell user={user}>
        <div className="py-4">
          <FeedbackAlert
            type="error"
            title="Acesso negado"
            message={accessMessage ?? "Seu perfil nao pode acessar mensalidades."}
          />
        </div>
      </AppShell>
    );
  }

  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const requestedYear = parseRequestedYear(resolvedSearchParams?.year);
  const currentYear = new Date().getUTCFullYear();
  const membershipFeeService = createMembershipFeeService();

  try {
    const sheetView =
      requestedYear && requestedYear !== currentYear
        ? await membershipFeeService.getMembershipFeeSheet(id, requestedYear)
        : await membershipFeeService.getOrCreateCurrentSheet(id);

    return (
      <AppShell user={user}>
        <MembershipFeeSection
          sheetView={sheetView}
          canEdit={canEdit}
          userName={user.name}
          userEmail={user.email}
          userRole={user.role}
          currentYear={currentYear}
        />
      </AppShell>
    );
  } catch (error) {
    if (
      error instanceof MembershipFeeNotFoundError &&
      error.message === "MEMBERSHIP_FEE_SHEET_NOT_FOUND"
    ) {
      const fallbackSheet = await membershipFeeService.getOrCreateCurrentSheet(id);

      return (
        <AppShell user={user}>
          <MembershipFeeSection
            sheetView={fallbackSheet}
            canEdit={canEdit}
            userName={user.name}
            userEmail={user.email}
            userRole={user.role}
            currentYear={currentYear}
          />
        </AppShell>
      );
    }

    if (
      error instanceof MembershipFeeNotFoundError ||
      error instanceof MembershipFeeValidationError
    ) {
      notFound();
    }

    throw error;
  }
}

function parseRequestedYear(value: string | undefined) {
  if (!value) {
    return null;
  }

  const parsedYear = Number.parseInt(value, 10);

  if (!Number.isInteger(parsedYear)) {
    return null;
  }

  return parsedYear;
}


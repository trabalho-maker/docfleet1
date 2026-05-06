import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FeedbackAlert } from "@/features/associates/components/feedback-alert";
import {
  canViewAssociates,
  getAssociateAccessMessage,
} from "@/features/associates/lib/associate-authorization";
import { getCurrentUser } from "@/features/auth/server/session";
import { MembershipFeePrintActions } from "@/features/membership-fees/components/membership-fee-print-actions";
import { MembershipFeePrintSheet } from "@/features/membership-fees/components/membership-fee-print-sheet";
import {
  createMembershipFeeService,
  MembershipFeeNotFoundError,
  MembershipFeeValidationError,
} from "@/features/membership-fees/server/membership-fee.service";

export const metadata: Metadata = {
  title: "Impressao da ficha de mensalidades",
  description: "Visualizacao fisica para impressao da ficha de mensalidades do associado.",
};

type PrintMembershipFeePageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    autoPrint?: string;
    year?: string;
  }>;
};

export default async function PrintMembershipFeePage({
  params,
  searchParams,
}: PrintMembershipFeePageProps) {
  const user = await getCurrentUser();
  const canView = canViewAssociates(user);
  const accessMessage = getAssociateAccessMessage(user);

  if (!canView) {
    return (
      <main className="df-page-container flex min-h-screen w-full flex-1 items-center px-6 py-10 sm:px-10">
        <div className="w-full max-w-3xl">
          <FeedbackAlert
            type="error"
            title="Acesso negado"
            message={accessMessage ?? "Seu perfil nao pode acessar a ficha de mensalidades."}
          />
        </div>
      </main>
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
      <main className="membership-print-root mx-auto flex w-full max-w-[980px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <MembershipFeePrintActions
          associateId={id}
          year={sheetView.sheet.referenceYear}
          currentYear={currentYear}
          autoPrint={resolvedSearchParams?.autoPrint === "1"}
        />
        <MembershipFeePrintSheet
          sheetView={sheetView}
          logoSrc="/logo-sintrarc-header-cropped.png"
        />
      </main>
    );
  } catch (error) {
    if (
      error instanceof MembershipFeeNotFoundError &&
      error.message === "MEMBERSHIP_FEE_SHEET_NOT_FOUND"
    ) {
      const fallbackSheet = await membershipFeeService.getOrCreateCurrentSheet(id);

      return (
        <main className="membership-print-root mx-auto flex w-full max-w-[980px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
          <MembershipFeePrintActions
            associateId={id}
            year={fallbackSheet.sheet.referenceYear}
            currentYear={currentYear}
            autoPrint={resolvedSearchParams?.autoPrint === "1"}
          />
          <MembershipFeePrintSheet
            sheetView={fallbackSheet}
            logoSrc="/logo-sintrarc-header-cropped.png"
          />
        </main>
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

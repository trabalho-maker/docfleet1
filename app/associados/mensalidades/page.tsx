import type { Metadata } from "next";
import type { AssociateProfileCategory } from "@/features/associates/types";
import { getCurrentUser } from "@/features/auth/server/session";
import { FeedbackAlert } from "@/features/associates/components/feedback-alert";
import {
  canViewAssociates,
  getAssociateAccessMessage,
} from "@/features/associates/lib/associate-authorization";
import { AppShell } from "@/features/dashboard/components/app-shell";
import { MembershipFeesOverviewSection } from "@/features/membership-fees/components/membership-fees-overview-section";
import {
  createMembershipFeeService,
} from "@/features/membership-fees/server/membership-fee.service";
import type { MembershipFeeOverviewStatusFilter } from "@/features/membership-fees/types";

export const metadata: Metadata = {
  title: "Mensalidades",
  description: "Central operacional do submodulo de mensalidades no DocFleet.",
};

type AssociatesMembershipFeesLandingPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AssociatesMembershipFeesLandingPage({
  searchParams,
}: AssociatesMembershipFeesLandingPageProps) {
  const user = await getCurrentUser();
  const canView = canViewAssociates(user);
  const accessMessage = getAssociateAccessMessage(user);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const filters = parseMembershipOverviewFilters(resolvedSearchParams);
  const membershipFeeService = createMembershipFeeService();
  const overview = canView
    ? await membershipFeeService.listMembershipFeeOverview(filters)
    : null;

  return (
    <AppShell user={user}>
      <div className="flex w-full flex-1 flex-col gap-6 py-2 sm:py-4">
        {!canView ? (
          <FeedbackAlert
            type="error"
            title="Acesso negado"
            message={accessMessage ?? "Seu perfil nao pode acessar mensalidades."}
          />
        ) : (
          overview ? (
            <MembershipFeesOverviewSection
              overview={overview}
              filters={filters}
              userName={user.name}
              userEmail={user.email}
              userRole={user.role}
            />
          ) : null
        )}
      </div>
    </AppShell>
  );
}

function parseMembershipOverviewFilters(
  searchParams?: Record<string, string | string[] | undefined>,
): {
  search: string;
  category: AssociateProfileCategory | "";
  status: MembershipFeeOverviewStatusFilter;
} {
  const search = getSingleSearchParam(searchParams?.search).trim();
  const categoryValue = getSingleSearchParam(searchParams?.category);
  const statusValue = getSingleSearchParam(searchParams?.status);

  return {
    search,
    category: isMembershipCategory(categoryValue) ? categoryValue : "",
    status: isMembershipStatusFilter(statusValue) ? statusValue : "all",
  };
}

function getSingleSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function isMembershipCategory(value: string): value is AssociateProfileCategory {
  return value === "TAXI" || value === "ESCOLAR" || value === "CAMINHAO" || value === "CNPJ";
}

function isMembershipStatusFilter(value: string): value is MembershipFeeOverviewStatusFilter {
  return (
    value === "all" ||
    value === "up_to_date" ||
    value === "one_overdue" ||
    value === "two_overdue" ||
    value === "three_plus_overdue"
  );
}

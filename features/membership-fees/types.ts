import type { AssociateProfileCategory } from "@/features/associates/types";

export type MembershipFeeSheetStatus = "active" | "archived";

export type MembershipFeeMonthStatus =
  | "paid"
  | "current_open"
  | "future"
  | "overdue"
  | "critical_overdue";

export type MembershipFeeSheet = {
  id: string;
  associateId: string;
  referenceYear: number;
  status: MembershipFeeSheetStatus;
  snapshotName: string | null;
  snapshotAddress: string | null;
  snapshotCategory: string | null;
  snapshotPhone: string | null;
  snapshotRegistrationSuffix: string | null;
  snapshotInss: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MembershipFeePayment = {
  id: string;
  sheetId: string;
  associateId: string;
  competenceYear: number;
  competenceMonth: number;
  paidAt: string;
  paidByUserId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MembershipFeeMonthState = {
  month: number;
  monthLabel: string;
  competenceLabel: string;
  status: MembershipFeeMonthStatus;
  paidAt: string | null;
  canConfirmPayment: boolean;
};

export type MembershipFeeAssociateSnapshot = {
  id: string;
  name: string;
  registrationNumber: string;
  displayName: string;
  displayAddress: string | null;
  displayCategory: string | null;
  displayPhone: string | null;
  displayRegistrationSuffix: string | null;
  displayInss: string | null;
};

export type MembershipFeeSheetView = {
  associate: MembershipFeeAssociateSnapshot;
  sheet: MembershipFeeSheet;
  payments: MembershipFeePayment[];
  months: MembershipFeeMonthState[];
  availableYears: number[];
  summary: {
    paidMonths: number;
    currentOpenMonths: number;
    futureMonths: number;
    overdueMonths: number;
    criticalMonths: number;
    totalOverdueMonths: number;
  };
  chargeMessage: string | null;
  chargeEligible: boolean;
};

export type ConfirmMembershipPaymentInput = {
  associateId: string;
  competenceYear: number;
  competenceMonth: number;
  paidByUserId?: string | null;
  notes?: string | null;
};

export type ReverseMembershipPaymentInput = {
  associateId: string;
  competenceYear: number;
  competenceMonth: number;
};

export type MembershipFeeOverviewStatusFilter =
  | "all"
  | "up_to_date"
  | "one_overdue"
  | "two_overdue"
  | "three_plus_overdue";

export type MembershipFeeOverviewFilters = {
  search?: string;
  category?: AssociateProfileCategory | "";
  status?: MembershipFeeOverviewStatusFilter;
};

export type MembershipFeeOverviewEntry = {
  associateId: string;
  name: string;
  category: AssociateProfileCategory | null;
  categoryLabel: string;
  registrationNumber: string;
  phone: string | null;
  overdueMonths: number;
  statusLabel: string;
  statusTone: "success" | "warning" | "danger";
  lastPaymentAt: string | null;
  currentYear: number;
};

export type MembershipFeeOverview = {
  entries: MembershipFeeOverviewEntry[];
  counts: {
    upToDate: number;
    oneOverdue: number;
    twoOverdue: number;
    threePlusOverdue: number;
  };
  totalAssociates: number;
  filteredAssociates: number;
};

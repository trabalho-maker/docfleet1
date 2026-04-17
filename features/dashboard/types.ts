import type { FleetDocument, OperationalAlert } from "@/features/data/types";
import type { AuthUser } from "@/features/auth/types";

export type DashboardKpiTone = "neutral" | "warning" | "danger" | "success";

export type DashboardKpiIcon =
  | "documents"
  | "attention"
  | "expired"
  | "associates";

export type DashboardKpi = {
  label: string;
  value: number;
  helper: string;
  tone: DashboardKpiTone;
  icon: DashboardKpiIcon;
};

export type DashboardDocumentsByTypeItem = {
  type: string;
  valid: number;
  attention: number;
  expired: number;
};

export type DashboardTimelinePoint = {
  label: string;
  total: number;
};

export type DashboardOverview = {
  user: AuthUser;
  title: string;
  description: string;
  kpis: DashboardKpi[];
  alertCount: number;
  recentDocuments: FleetDocument[];
  alerts: OperationalAlert[];
  documentsByType: DashboardDocumentsByTypeItem[];
  expirationTimeline: DashboardTimelinePoint[];
};

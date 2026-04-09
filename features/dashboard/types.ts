import type {
  DashboardMetric,
  FleetDocument,
  OperationalAlert,
} from "@/features/data/types";
import type { AuthUser } from "@/features/auth/types";

export type { DashboardMetric } from "@/features/data/types";

export type DashboardOverview = {
  user: AuthUser;
  metrics: DashboardMetric[];
  recentDocuments: FleetDocument[];
  alerts: OperationalAlert[];
};

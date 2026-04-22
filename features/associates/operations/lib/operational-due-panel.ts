import type {
  AssociateOperationEntry,
  AssociateOperationRequirement,
} from "@/features/associates/operations/types";

export const TAXISTA_OPERATIONAL_MONITORING_WINDOW_DAYS = 60;

export type OperationalDuePanelData = {
  totalUpcoming: number;
  monthBuckets: Array<{
    key: string;
    label: string;
    count: number;
  }>;
  requirementBuckets: Array<{
    label: string;
    count: number;
  }>;
};

export function buildOperationalDuePanel(
  entries: AssociateOperationEntry[],
  options: {
    now?: Date;
    windowDays?: number;
  } = {},
): OperationalDuePanelData {
  const today = getUtcDayStart(options.now ?? new Date());
  const windowDays =
    options.windowDays ?? TAXISTA_OPERATIONAL_MONITORING_WINDOW_DAYS;
  const limit = new Date(today);
  limit.setUTCDate(limit.getUTCDate() + windowDays);
  const monthMap = new Map<string, { key: string; label: string; count: number }>();
  const requirementMap = new Map<string, number>();
  let totalUpcoming = 0;

  for (const entry of entries) {
    for (const requirement of entry.requirements) {
      const dueDate = parseDueDate(requirement);

      if (!dueDate || dueDate < today || dueDate > limit) {
        continue;
      }

      totalUpcoming += 1;

      const monthKey = `${dueDate.getUTCFullYear()}-${String(
        dueDate.getUTCMonth() + 1,
      ).padStart(2, "0")}`;
      const existingMonth = monthMap.get(monthKey);

      if (existingMonth) {
        existingMonth.count += 1;
      } else {
        monthMap.set(monthKey, {
          key: monthKey,
          label: formatMonthLabel(dueDate),
          count: 1,
        });
      }

      requirementMap.set(
        requirement.label,
        (requirementMap.get(requirement.label) ?? 0) + 1,
      );
    }
  }

  return {
    totalUpcoming,
    monthBuckets: [...monthMap.values()].sort((left, right) =>
      left.key.localeCompare(right.key),
    ),
    requirementBuckets: [...requirementMap.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label)),
  };
}

function parseDueDate(requirement: AssociateOperationRequirement) {
  if (!requirement.dueDate) {
    return null;
  }

  const date = new Date(`${requirement.dueDate}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getUtcDayStart(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

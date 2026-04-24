import type { FleetDocument } from "@/features/data/types";
import { getDaysUntilDocumentDueDate } from "@/features/documents/lib/expiration";

export type DocumentDueSummary = {
  total: number;
  expired: number;
  dueIn15Days: number;
  dueIn30Days: number;
};

export function summarizeDocumentsByDueDate(
  documents: FleetDocument[],
  now = new Date(),
): DocumentDueSummary {
  return documents.reduce<DocumentDueSummary>(
    (summary, document) => {
      const daysUntilDue = getDaysUntilDocumentDueDate(document.dueDate, now);

      summary.total += 1;

      if (daysUntilDue === null || daysUntilDue < 0) {
        summary.expired += 1;
        return summary;
      }

      if (daysUntilDue <= 15) {
        summary.dueIn15Days += 1;
        return summary;
      }

      if (daysUntilDue <= 30) {
        summary.dueIn30Days += 1;
      }

      return summary;
    },
    {
      total: 0,
      expired: 0,
      dueIn15Days: 0,
      dueIn30Days: 0,
    },
  );
}

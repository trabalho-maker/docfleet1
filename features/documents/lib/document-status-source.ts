import type { DocumentStatus, FleetDocument } from "@/features/data/types";
import type { DocumentType } from "@/features/documents/constants";
import { calculateDocumentStatus } from "@/features/documents/lib/expiration";

export type ResolvedDocumentRequirement = {
  dueDate: string | null;
  status: DocumentStatus | "Missing";
  source: "document" | "operation_profile" | "missing";
  document: FleetDocument | null;
};

export type AssociateDocumentStatusSummary = {
  status: DocumentStatus | "Missing";
  documentsCount: number;
  nextDueDate: string | null;
};

const documentStatusSeverity: Record<DocumentStatus, number> = {
  Valido: 0,
  Atencao: 1,
  Vencido: 2,
};

export function resolveDocumentRequirement(
  documents: FleetDocument[],
  options: {
    documentType?: DocumentType;
    fallbackDueDate?: string | null;
  },
): ResolvedDocumentRequirement {
  const matchingDocument = options.documentType
    ? documents.find((document) => document.documentType === options.documentType) ?? null
    : null;

  if (matchingDocument) {
    return {
      dueDate: matchingDocument.dueDate,
      status: matchingDocument.status,
      source: "document",
      document: matchingDocument,
    };
  }

  if (options.fallbackDueDate) {
    return {
      dueDate: options.fallbackDueDate,
      status: calculateDocumentStatus(options.fallbackDueDate),
      source: "operation_profile",
      document: null,
    };
  }

  return {
    dueDate: null,
    status: "Missing",
    source: "missing",
    document: null,
  };
}

export function summarizeAssociateDocumentStatus(
  documents: FleetDocument[],
): AssociateDocumentStatusSummary {
  if (documents.length === 0) {
    return {
      status: "Missing",
      documentsCount: 0,
      nextDueDate: null,
    };
  }

  const sortedDocuments = [...documents].sort((left, right) => {
    const severityDelta =
      documentStatusSeverity[right.status] - documentStatusSeverity[left.status];

    if (severityDelta !== 0) {
      return severityDelta;
    }

    return left.dueDate.localeCompare(right.dueDate);
  });

  const nextDueDate = [...documents]
    .map((document) => document.dueDate)
    .sort((left, right) => left.localeCompare(right))[0] ?? null;

  return {
    status: sortedDocuments[0]?.status ?? "Missing",
    documentsCount: documents.length,
    nextDueDate,
  };
}

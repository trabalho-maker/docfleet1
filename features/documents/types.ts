import type { FleetDocument } from "@/features/data/types";
import type {
  AssociateDocumentType,
  DocumentCategoryFilter,
} from "@/features/documents/constants";

export type DocumentFormValues = {
  dueDate: string;
  notes: string;
};

export type DocumentFormErrors = Partial<Record<keyof DocumentFormValues, string>>;

export type DocumentUiMessage = {
  type: "success" | "error";
  text: string;
};

export type DocumentsApiResponse = {
  documents: FleetDocument[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  summary: {
    total: number;
    expired: number;
    dueIn15Days: number;
    dueIn30Days: number;
  };
};

export type DocumentApiResponse = {
  document: FleetDocument;
};

export type DocumentListFilters = {
  category: DocumentCategoryFilter | "";
};

export type AssociateDocumentFormValues = Record<AssociateDocumentType, string>;
export type AssociateDocumentFieldErrors = Partial<
  Record<AssociateDocumentType, string>
>;

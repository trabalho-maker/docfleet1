import type { FleetDocument } from "@/features/data/types";

export type DocumentFormValues = {
  name: string;
  type: string;
  dueDate: string;
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
    requiringAttention: number;
    attention: number;
  };
};

export type DocumentApiResponse = {
  document: FleetDocument;
};

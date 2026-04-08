import type { DocumentStatus, FleetDocument } from "@/features/data/types";

export type DocumentFormValues = {
  name: string;
  type: string;
  dueDate: string;
  status: DocumentStatus;
};

export type DocumentsApiResponse = {
  documents: FleetDocument[];
};

export type DocumentApiResponse = {
  document: FleetDocument;
};

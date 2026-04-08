import type { FleetDocument } from "@/features/data/types";

export type DocumentFormValues = {
  name: string;
  type: string;
  dueDate: string;
};

export type DocumentsApiResponse = {
  documents: FleetDocument[];
};

export type DocumentApiResponse = {
  document: FleetDocument;
};

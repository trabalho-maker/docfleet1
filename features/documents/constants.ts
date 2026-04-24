import type { AssociateProfileCategory } from "@/features/associates/types";

export const documentTypes = [
  "CNH",
  "TOXICOLOGICO",
  "AUTORIZACAO_CONDUTOR",
  "AUTORIZACAO_VEICULO",
  "TACOGRAFO",
  "OUTRO",
] as const;

export type DocumentType = (typeof documentTypes)[number];

export const associateDocumentTypes = documentTypes.filter(
  (type) => type !== "OUTRO",
) as Exclude<DocumentType, "OUTRO">[];

export type AssociateDocumentType = (typeof associateDocumentTypes)[number];

export const documentCategoryFilters = [
  "TAXI",
  "ESCOLAR",
  "CAMINHAO",
] as const satisfies readonly AssociateProfileCategory[];

export type DocumentCategoryFilter = (typeof documentCategoryFilters)[number];

const documentTypeLabels: Record<DocumentType, string> = {
  CNH: "CNH",
  TOXICOLOGICO: "Toxicologico",
  AUTORIZACAO_CONDUTOR: "Autorizacao condutor",
  AUTORIZACAO_VEICULO: "Autorizacao veiculo",
  TACOGRAFO: "Tacografo",
  OUTRO: "Outro",
};

export function getDocumentTypeLabel(type: DocumentType) {
  return documentTypeLabels[type];
}

function normalizeDocumentTypeInput(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");
}

export function parseDocumentType(
  value: string | null | undefined,
): DocumentType | null {
  const normalizedValue = normalizeDocumentTypeInput(value);

  if (normalizedValue === "TOXICOLOGICO") {
    return "TOXICOLOGICO";
  }

  if (normalizedValue === "AUTORIZACAO_CONDUTOR") {
    return "AUTORIZACAO_CONDUTOR";
  }

  if (normalizedValue === "AUTORIZACAO_VEICULO") {
    return "AUTORIZACAO_VEICULO";
  }

  if (normalizedValue === "TACOGRAFO") {
    return "TACOGRAFO";
  }

  if (normalizedValue === "CNH") {
    return "CNH";
  }

  if (normalizedValue === "OUTRO") {
    return "OUTRO";
  }

  return null;
}

export function normalizeDocumentType(value: string | null | undefined): DocumentType {
  return parseDocumentType(value) ?? "OUTRO";
}

import {
  documentStatuses,
  type DocumentStatus,
} from "@/features/data/types";
import type { DocumentFormValues } from "@/features/documents/types";

export type DocumentValidationResult =
  | {
      success: true;
      data: DocumentFormValues;
    }
  | {
      success: false;
      errors: Partial<Record<keyof DocumentFormValues, string>>;
    };

function isValidDueDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(`${value}T00:00:00Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
  );
}

function normalizeStatus(status: string): DocumentStatus | null {
  return documentStatuses.find((item) => item === status) ?? null;
}

export function validateDocumentInput(
  input: DocumentFormValues,
): DocumentValidationResult {
  const name = input.name.trim();
  const type = input.type.trim();
  const dueDate = input.dueDate.trim();
  const status = normalizeStatus(input.status);
  const errors: Partial<Record<keyof DocumentFormValues, string>> = {};

  if (name.length < 3) {
    errors.name = "Informe um nome com pelo menos 3 caracteres.";
  }

  if (type.length < 2) {
    errors.type = "Informe um tipo com pelo menos 2 caracteres.";
  }

  if (!isValidDueDate(dueDate)) {
    errors.dueDate = "Informe uma data de vencimento valida.";
  }

  if (!status) {
    errors.status = "Selecione um status valido.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      errors,
    };
  }

  return {
    success: true,
    data: {
      name,
      type,
      dueDate,
      status: status as DocumentStatus,
    },
  };
}

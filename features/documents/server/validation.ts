import type { DocumentFormValues } from "@/features/documents/types";
import { parseDocumentDueDate } from "@/features/documents/lib/expiration";
import {
  hasExceededMaxLength,
  normalizePlainTextInput,
} from "@/lib/security/input";

const MAX_DOCUMENT_NAME_LENGTH = 160;
const MAX_DOCUMENT_TYPE_LENGTH = 80;

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

export function validateDocumentInput(
  input: DocumentFormValues,
): DocumentValidationResult {
  const name = normalizePlainTextInput(input.name);
  const type = normalizePlainTextInput(input.type);
  const dueDate = input.dueDate.trim();
  const errors: Partial<Record<keyof DocumentFormValues, string>> = {};

  if (name.length < 3) {
    errors.name = "Informe um nome com pelo menos 3 caracteres.";
  } else if (hasExceededMaxLength(name, MAX_DOCUMENT_NAME_LENGTH)) {
    errors.name = `Informe um nome com no maximo ${MAX_DOCUMENT_NAME_LENGTH} caracteres.`;
  }

  if (type.length < 2) {
    errors.type = "Informe um tipo com pelo menos 2 caracteres.";
  } else if (hasExceededMaxLength(type, MAX_DOCUMENT_TYPE_LENGTH)) {
    errors.type = `Informe um tipo com no maximo ${MAX_DOCUMENT_TYPE_LENGTH} caracteres.`;
  }

  if (!isValidDueDate(dueDate) || !parseDocumentDueDate(dueDate)) {
    errors.dueDate = "Informe uma data de vencimento valida.";
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
    },
  };
}

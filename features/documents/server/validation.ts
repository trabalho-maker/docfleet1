import type { DocumentFormValues } from "@/features/documents/types";
import { parseDocumentDueDate } from "@/features/documents/lib/expiration";
import {
  hasExceededMaxLength,
  normalizePlainTextInput,
} from "@/lib/security/input";

const MAX_DOCUMENT_NOTES_LENGTH = 500;

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
  const dueDate = input.dueDate.trim();
  const notes = normalizePlainTextInput(input.notes);
  const errors: Partial<Record<keyof DocumentFormValues, string>> = {};

  if (notes && hasExceededMaxLength(notes, MAX_DOCUMENT_NOTES_LENGTH)) {
    errors.notes = `Informe uma observação com no máximo ${MAX_DOCUMENT_NOTES_LENGTH} caracteres.`;
  }

  if (!isValidDueDate(dueDate) || !parseDocumentDueDate(dueDate)) {
    errors.dueDate = "Informe uma data de vencimento válida.";
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
      dueDate,
      notes,
    },
  };
}

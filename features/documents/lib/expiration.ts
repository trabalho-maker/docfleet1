import type { DocumentStatus } from "@/features/data/types";

export const DOCUMENT_ATTENTION_WINDOW_DAYS = 30;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function startOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function formatUtcDateOnly(date: Date) {
  return startOfUtcDay(date).toISOString().slice(0, 10);
}

export function addUtcDays(date: Date, days: number) {
  const utcDate = startOfUtcDay(date);
  return new Date(utcDate.getTime() + days * DAY_IN_MS);
}

export function parseDocumentDueDate(dueDate: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    return null;
  }

  const [year, month, day] = dueDate.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() + 1 !== month ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return parsed;
}

export function getDaysUntilDocumentDueDate(dueDate: string, now = new Date()) {
  const parsedDueDate = parseDocumentDueDate(dueDate);

  if (!parsedDueDate) {
    return null;
  }

  const today = startOfUtcDay(now);
  return Math.floor((parsedDueDate.getTime() - today.getTime()) / DAY_IN_MS);
}

export function calculateDocumentStatus(
  dueDate: string,
  options?: {
    now?: Date;
    attentionWindowDays?: number;
  },
): DocumentStatus {
  const daysUntilDueDate = getDaysUntilDocumentDueDate(
    dueDate,
    options?.now,
  );
  const attentionWindowDays =
    options?.attentionWindowDays ?? DOCUMENT_ATTENTION_WINDOW_DAYS;

  if (daysUntilDueDate === null) {
    return "Vencido";
  }

  if (daysUntilDueDate < 0) {
    return "Vencido";
  }

  if (daysUntilDueDate <= attentionWindowDays) {
    return "Atencao";
  }

  return "Valido";
}

export function getDocumentAttentionThresholdDate(
  now = new Date(),
  attentionWindowDays = DOCUMENT_ATTENTION_WINDOW_DAYS,
) {
  return formatUtcDateOnly(addUtcDays(now, attentionWindowDays));
}

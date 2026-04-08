const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;
const MULTIPLE_WHITESPACE = /\s+/g;

export function normalizePlainTextInput(value: string) {
  return value
    .replace(CONTROL_CHARS, " ")
    .replace(MULTIPLE_WHITESPACE, " ")
    .trim();
}

export function normalizeEmailInput(value: string) {
  return normalizePlainTextInput(value).toLowerCase();
}

export function hasExceededMaxLength(value: string, maxLength: number) {
  return value.length > maxLength;
}

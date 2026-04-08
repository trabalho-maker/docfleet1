import {
  DOCUMENT_ATTENTION_WINDOW_DAYS,
  calculateDocumentStatus,
  formatUtcDateOnly,
  addUtcDays,
  getDaysUntilDocumentDueDate,
} from "@/features/documents/lib/expiration";

describe("document expiration helpers", () => {
  const now = new Date("2026-04-08T12:00:00Z");

  it("marks a document as vencido when the due date is in the past", () => {
    expect(calculateDocumentStatus("2026-04-07", { now })).toBe("Vencido");
  });

  it("marks a document as atencao inside the attention window", () => {
    const dueDate = formatUtcDateOnly(
      addUtcDays(now, DOCUMENT_ATTENTION_WINDOW_DAYS),
    );

    expect(calculateDocumentStatus(dueDate, { now })).toBe("Atencao");
  });

  it("marks a document as valido outside the attention window", () => {
    const dueDate = formatUtcDateOnly(
      addUtcDays(now, DOCUMENT_ATTENTION_WINDOW_DAYS + 1),
    );

    expect(calculateDocumentStatus(dueDate, { now })).toBe("Valido");
  });

  it("returns the calendar day difference until the due date", () => {
    const dueDate = formatUtcDateOnly(addUtcDays(now, 12));

    expect(getDaysUntilDocumentDueDate(dueDate, now)).toBe(12);
  });
});

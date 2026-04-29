import { validateDocumentInput } from "@/features/documents/server/validation";

describe("document validation", () => {
  it("accepts valid input and trims notes", () => {
    const result = validateDocumentInput({
      dueDate: "2026-04-30",
      notes: "  acompanhamento mensal  ",
    });

    expect(result).toEqual({
      success: true,
      data: {
        dueDate: "2026-04-30",
        notes: "acompanhamento mensal",
      },
    });
  });

  it("rejects impossible calendar dates", () => {
    const result = validateDocumentInput({
      dueDate: "2026-02-30",
      notes: "",
    });

    expect(result.success).toBe(false);
    expect(result).toMatchObject({
      errors: {
        dueDate: "Informe uma data de vencimento válida.",
      },
    });
  });

  it("accepts leap day when the year is valid", () => {
    const result = validateDocumentInput({
      dueDate: "2028-02-29",
      notes: "",
    });

    expect(result.success).toBe(true);
  });

  it("rejects notes above the maximum allowed length", () => {
    const result = validateDocumentInput({
      dueDate: "2026-04-30",
      notes: "N".repeat(501),
    });

    expect(result.success).toBe(false);
    expect(result).toMatchObject({
      errors: {
        notes: "Informe uma observação com no máximo 500 caracteres.",
      },
    });
  });
});

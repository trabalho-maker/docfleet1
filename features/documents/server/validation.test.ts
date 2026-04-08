import { validateDocumentInput } from "@/features/documents/server/validation";

describe("document validation", () => {
  it("accepts valid input and trims name/type", () => {
    const result = validateDocumentInput({
      name: "  Licenciamento anual  ",
      type: "  Veiculos  ",
      dueDate: "2026-04-30",
    });

    expect(result).toEqual({
      success: true,
      data: {
        name: "Licenciamento anual",
        type: "Veiculos",
        dueDate: "2026-04-30",
      },
    });
  });

  it("rejects impossible calendar dates", () => {
    const result = validateDocumentInput({
      name: "Licenciamento anual",
      type: "Veiculos",
      dueDate: "2026-02-30",
    });

    expect(result.success).toBe(false);
    expect(result).toMatchObject({
      errors: {
        dueDate: "Informe uma data de vencimento valida.",
      },
    });
  });

  it("rejects names and types that are too short", () => {
    const result = validateDocumentInput({
      name: "AB",
      type: "X",
      dueDate: "2026-04-30",
    });

    expect(result.success).toBe(false);
    expect(result).toMatchObject({
      errors: {
        name: "Informe um nome com pelo menos 3 caracteres.",
        type: "Informe um tipo com pelo menos 2 caracteres.",
      },
    });
  });

  it("accepts leap day when the year is valid", () => {
    const result = validateDocumentInput({
      name: "ASO anual",
      type: "Pessoas",
      dueDate: "2028-02-29",
    });

    expect(result.success).toBe(true);
  });
});

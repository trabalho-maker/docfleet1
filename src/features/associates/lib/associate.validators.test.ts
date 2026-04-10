import {
  normalizeAssociateCpf,
  validateAssociateCpf,
  validateCreateAssociateInput,
} from "@/src/features/associates/lib/associate.validators";

describe("associate validators", () => {
  it("normalizes CPF by removing the mask", () => {
    expect(normalizeAssociateCpf("390.533.447-05")).toBe("39053344705");
  });

  it("accepts a valid CPF", () => {
    expect(validateAssociateCpf("39053344705")).toBe(true);
  });

  it("rejects an invalid CPF", () => {
    expect(validateAssociateCpf("11111111111")).toBe(false);
  });

  it("returns field errors for invalid create input", () => {
    const result = validateCreateAssociateInput({
      name: "Ma",
      cpf: "111.111.111-11",
      category: "Titular",
      registrationNumber: "",
      status: "Ativo",
      admissionDate: "2026-99-99",
    });

    expect(result.success).toBe(false);
    expect(result).toMatchObject({
      errors: {
        name: "Informe um nome com pelo menos 3 caracteres.",
        cpf: "Informe um CPF valido.",
        registrationNumber: "Informe uma matricula.",
        admissionDate: "Informe uma data de admissao valida.",
      },
    });
  });
});

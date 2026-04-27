import {
  normalizeAssociateCpf,
  validateAssociateFilters,
  validateAssociateCpf,
  validateCreateAssociateInput,
} from "@/features/associates/lib/associate.validators";

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
        cpf: "Informe um CPF válido.",
        registrationNumber: "Informe uma matrícula.",
        admissionDate: "Informe uma data de admissão válida.",
      },
    });
  });

  it("normalizes optional profile fields when provided", () => {
    const result = validateCreateAssociateInput({
      name: "Maria de Souza",
      cpf: "390.533.447-05",
      category: "Titular",
      registrationNumber: "MAT-2026-3000",
      status: "Ativo",
      admissionDate: "2025-01-10",
      cidade: " Rio Claro ",
      estado: "sp",
      cep: "13500-000",
      email: "CONTATO@EXEMPLO.COM",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.cidade).toBe("Rio Claro");
      expect(result.data.estado).toBe("SP");
      expect(result.data.cep).toBe("13500000");
      expect(result.data.email).toBe("contato@exemplo.com");
    }
  });

  it("rejects legacy statuses for new submissions", () => {
    const result = validateCreateAssociateInput({
      name: "Maria de Souza",
      cpf: "390.533.447-05",
      category: "Titular",
      registrationNumber: "MAT-2026-3000",
      status: "Suspenso",
      admissionDate: "2025-01-10",
    });

    expect(result.success).toBe(false);
    expect(result).toMatchObject({
      errors: {
        status: "Informe um status válido.",
      },
    });
  });

  it("keeps legacy statuses valid for filters", () => {
    const result = validateAssociateFilters({
      status: "Bloqueado",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.status).toBe("Bloqueado");
    }
  });
});

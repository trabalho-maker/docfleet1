jest.mock("@/features/associates/server/access", () => ({
  requireAssociateModuleAccess: jest.fn(),
  AssociateAccessDeniedError: class AssociateAccessDeniedError extends Error {},
}));

jest.mock("@/features/associates/server/associate.service", () => ({
  createAssociateService: jest.fn(),
  AssociateConflictError: class AssociateConflictError extends Error {},
  AssociateValidationError: class AssociateValidationError extends Error {},
  AssociateNotFoundError: class AssociateNotFoundError extends Error {},
}));

import { createAssociateAction } from "@/features/associates/actions/create-associate";
import { updateAssociateAction } from "@/features/associates/actions/update-associate";
import { requireAssociateModuleAccess } from "@/features/associates/server/access";
import { createAssociateService } from "@/features/associates/server/associate.service";
import type { AssociateFormValues } from "@/features/associates/types";

const mockedRequireAssociateModuleAccess = jest.mocked(requireAssociateModuleAccess);
const mockedCreateAssociateService = jest.mocked(createAssociateService);

function buildFormValues(
  overrides: Partial<AssociateFormValues> = {},
): AssociateFormValues {
  return {
    name: "Maria de Souza",
    cpf: "390.533.447-05",
    category: "Contribuinte",
    registrationNumber: "MAT-2026-0001",
    status: "Ativo",
    admissionDate: "2025-01-10",
    modalidadeAssociado: "TAXI",
    cnpjEmpresa: "",
    nomeEmpresa: "",
    enderecoCompleto: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: "",
    profissao: "",
    sexo: "",
    dataNascimento: "",
    nacionalidade: "",
    naturalidade: "",
    rg: "",
    cnh: "",
    estadoCivil: "",
    nomePai: "",
    nomeMae: "",
    dependentes: "",
    grauParentesco: "",
    telefone: "",
    celular: "",
    email: "",
    observacoes: "",
    situacaoFinanceira: "",
    situacaoDocumental: "",
    historicoResumo: "",
    fotoUrl: "",
    ...overrides,
  };
}

describe("associate actions", () => {
  const createAssociate = jest.fn();
  const updateAssociate = jest.fn();

  beforeEach(() => {
    createAssociate.mockReset();
    updateAssociate.mockReset();
    mockedRequireAssociateModuleAccess.mockReset();
    mockedCreateAssociateService.mockReset();

    mockedRequireAssociateModuleAccess.mockResolvedValue({
      id: "usr_01",
      name: "Gestor",
      email: "gestor@docfleet.local",
      role: "Gestor de frota",
    });

    mockedCreateAssociateService.mockReturnValue({
      createAssociate,
      updateAssociate,
    } as unknown as ReturnType<typeof createAssociateService>);
  });

  it("forces category to Titular on create", async () => {
    createAssociate.mockResolvedValue({
      id: "asc_100",
    });

    const result = await createAssociateAction(buildFormValues());

    expect(result).toEqual({
      success: true,
      associateId: "asc_100",
    });
    expect(createAssociate).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "Titular",
      }),
    );
  });

  it("forces category to Titular on update", async () => {
    updateAssociate.mockResolvedValue({
      id: "asc_01",
    });

    const result = await updateAssociateAction("asc_01", buildFormValues());

    expect(result).toEqual({
      success: true,
      associateId: "asc_01",
    });
    expect(updateAssociate).toHaveBeenCalledWith(
      "asc_01",
      expect.objectContaining({
        category: "Titular",
      }),
    );
  });

  it("returns field errors for duplicate RG/CNH/CNPJ conflicts", async () => {
    const { AssociateConflictError } = jest.requireMock(
      "@/features/associates/server/associate.service",
    ) as {
      AssociateConflictError: new (message: string) => Error;
    };

    createAssociate.mockRejectedValueOnce(
      new AssociateConflictError("ASSOCIATE_RG_ALREADY_EXISTS"),
    );
    await expect(createAssociateAction(buildFormValues({ rg: "28.456.789-0" }))).resolves.toEqual({
      success: false,
      fieldErrors: {
        rg: "JÃ¡ existe um associado cadastrado com este RG.",
      },
    });

    updateAssociate.mockRejectedValueOnce(
      new AssociateConflictError("ASSOCIATE_CNH_ALREADY_EXISTS"),
    );
    await expect(
      updateAssociateAction("asc_01", buildFormValues({ cnh: "01234567890" })),
    ).resolves.toEqual({
      success: false,
      fieldErrors: {
        cnh: "JÃ¡ existe um associado cadastrado com esta CNH.",
      },
    });

    createAssociate.mockRejectedValueOnce(
      new AssociateConflictError("ASSOCIATE_COMPANY_CNPJ_ALREADY_EXISTS"),
    );
    await expect(
      createAssociateAction(
        buildFormValues({
          modalidadeAssociado: "CNPJ",
          nomeEmpresa: "Empresa",
          cnpjEmpresa: "27.865.757/0001-02",
        }),
      ),
    ).resolves.toEqual({
      success: false,
      fieldErrors: {
        cnpjEmpresa: "JÃ¡ existe um associado cadastrado com este CNPJ.",
      },
    });
  });
});

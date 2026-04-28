import {
  normalizeAssociateCpf,
  validateAssociateCpf,
} from "@/features/associates/lib/associate.validators";
import {
  AssociateConflictError,
  AssociateNotFoundError,
} from "@/features/associates/server/associate.service";
import {
  SqliteTaxistaCadastroRepository,
  type TaxistaCadastroRepository,
} from "@/features/taxistas/cadastro/server/taxista-cadastro.repository";
import type {
  TaxistaAlvaraStatus,
  TaxistaCadastroFieldErrors,
  TaxistaCadastroListFilters,
  TaxistaCadastroFormValues,
  TaxistaCadastroRecord,
} from "@/features/taxistas/cadastro/types";

type TaxistaCadastroServiceOptions = {
  repository?: TaxistaCadastroRepository;
};

export function createTaxistaCadastroService(
  options: TaxistaCadastroServiceOptions = {},
) {
  const repository =
    options.repository ?? new SqliteTaxistaCadastroRepository();

  return {
    listTaxistas(filters?: TaxistaCadastroListFilters) {
      return repository.findMany(filters);
    },

    getTaxistaByAssociateId(associateId: string) {
      return repository.findByAssociateId(associateId);
    },

    async updateTaxistaAlvaraStatus(
      associateId: string,
      nextStatus: TaxistaAlvaraStatus,
    ) {
      const currentRecord = await repository.findByAssociateId(associateId);

      if (!currentRecord) {
        throw new Error("TAXISTA_NOT_FOUND");
      }

      if (
        nextStatus === "PRONTO" &&
        currentRecord.statusAlvara !== "PROTOCOLADO"
      ) {
        throw new Error("TAXISTA_PRONTO_REQUIRES_PROTOCOLADO");
      }

      await repository.updateStatusAlvara(associateId, nextStatus);
    },

    clearReadyTaxistas() {
      return repository.clearReadyStatuses();
    },

    async updateTaxistaCadastro(
      associateId: string,
      input: TaxistaCadastroFormValues,
    ) {
      const validation = validateTaxistaCadastroInput(input);

      if (!validation.success) {
        return validation;
      }

      const currentRecord = await repository.findByAssociateId(associateId);

      if (!currentRecord) {
        throw new AssociateNotFoundError();
      }

      try {
        const observacao = buildLastUpdateSummary(
          currentRecord,
          validation.data,
          new Date(),
        );

        await repository.saveCadastro(associateId, {
          name: validation.data.name,
          cpf: validation.data.cpf,
          telefone: validation.data.telefone,
          endereco: validation.data.endereco,
          statusAlvara: currentRecord.statusAlvara,
          selo: validation.data.selo,
          ponto: validation.data.ponto,
          placa: validation.data.placa,
          modeloVeiculo: validation.data.modeloVeiculo,
          pressaoKgfM2: validation.data.pressaoKgfM2,
          numeroTaximetro: validation.data.numeroTaximetro,
          modeloTaximetro: validation.data.modeloTaximetro,
          constante: validation.data.constante,
          inmetro: validation.data.inmetro,
          instalacao: validation.data.instalacao,
          trocaTaximetro: validation.data.trocaTaximetro,
          pneu: validation.data.pneu,
          deca: validation.data.deca,
          lacreModulo: validation.data.lacreModulo,
          lacreTaxi: validation.data.lacreTaxi,
          modulo: validation.data.modulo,
          cinta: validation.data.cinta,
          colocado: validation.data.colocado,
          retirado: validation.data.retirado,
          observacao,
        });
      } catch (error) {
        if (error instanceof Error && error.message === "ASSOCIATE_NOT_FOUND") {
          throw new AssociateNotFoundError();
        }

        if (
          error instanceof Error &&
          error.message === "ASSOCIATE_CPF_ALREADY_EXISTS"
        ) {
          throw new AssociateConflictError("ASSOCIATE_CPF_ALREADY_EXISTS");
        }

        throw error;
      }

      return validation;
    },
  };
}

type ValidationResult =
  | {
      success: true;
      data: ReturnType<typeof normalizeTaxistaCadastroInput>;
    }
  | {
      success: false;
      fieldErrors: TaxistaCadastroFieldErrors;
    };

function validateTaxistaCadastroInput(
  input: TaxistaCadastroFormValues,
): ValidationResult {
  const normalized = normalizeTaxistaCadastroInput(input);
  const fieldErrors: TaxistaCadastroFieldErrors = {};

  if (!normalized.name) {
    fieldErrors.name = "Informe o nome do taxista.";
  }

  if (!normalized.cpf) {
    fieldErrors.cpf = "Informe o CPF do taxista.";
  } else if (!validateAssociateCpf(normalized.cpf)) {
    fieldErrors.cpf = "Informe um CPF valido.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      fieldErrors,
    };
  }

  return {
    success: true,
    data: normalized,
  };
}

function normalizeTaxistaCadastroInput(input: TaxistaCadastroFormValues) {
  return {
    name: normalizeRequiredText(input.name),
    cpf: normalizeAssociateCpf(input.cpf),
    telefone: normalizeOptionalText(input.telefone),
    endereco: normalizeOptionalText(input.endereco),
    selo: normalizeOptionalText(input.selo),
    ponto: normalizeOptionalText(input.ponto),
    placa: normalizeOptionalText(input.placa)?.toUpperCase() ?? null,
    modeloVeiculo: normalizeOptionalText(input.modeloVeiculo),
    pressaoKgfM2: normalizeOptionalText(input.pressaoKgfM2),
    numeroTaximetro: normalizeOptionalText(input.numeroTaximetro),
    modeloTaximetro: normalizeOptionalText(input.modeloTaximetro),
    constante: normalizeOptionalText(input.constante),
    inmetro: normalizeOptionalText(input.inmetro),
    instalacao: normalizeOptionalText(input.instalacao),
    trocaTaximetro: normalizeOptionalText(input.trocaTaximetro),
    pneu: normalizeOptionalText(input.pneu),
    deca: normalizeOptionalText(input.deca),
    lacreModulo: normalizeOptionalText(input.lacreModulo),
    lacreTaxi: normalizeOptionalText(input.lacreTaxi),
    modulo: normalizeOptionalText(input.modulo),
    cinta: normalizeOptionalText(input.cinta),
    colocado: normalizeOptionalText(input.colocado),
    retirado: normalizeOptionalText(input.retirado),
  };
}

function normalizeRequiredText(value: string) {
  return value.trim();
}

function normalizeOptionalText(value: string) {
  const normalized = value.trim();
  return normalized ? normalized : null;
}

const fieldLabels: Array<{
  key: keyof ReturnType<typeof normalizeTaxistaCadastroInput>;
  label: string;
}> = [
  { key: "name", label: "nome" },
  { key: "cpf", label: "cpf" },
  { key: "telefone", label: "telefone" },
  { key: "endereco", label: "endereco" },
  { key: "selo", label: "selo" },
  { key: "ponto", label: "ponto" },
  { key: "deca", label: "deca" },
  { key: "placa", label: "placa" },
  { key: "modeloVeiculo", label: "modelo veiculo" },
  { key: "pneu", label: "pneu" },
  { key: "pressaoKgfM2", label: "pressao kgf/m2" },
  { key: "numeroTaximetro", label: "numero taximetro" },
  { key: "modeloTaximetro", label: "modelo taximetro" },
  { key: "constante", label: "constante" },
  { key: "inmetro", label: "inmetro" },
  { key: "trocaTaximetro", label: "troca de taximetro" },
  { key: "instalacao", label: "instalacao" },
  { key: "lacreModulo", label: "lacre modulo" },
  { key: "lacreTaxi", label: "lacre taxi" },
  { key: "modulo", label: "modulo" },
  { key: "cinta", label: "cinta" },
  { key: "colocado", label: "colocado" },
  { key: "retirado", label: "retirado" },
];

function buildLastUpdateSummary(
  currentRecord: TaxistaCadastroRecord,
  nextData: ReturnType<typeof normalizeTaxistaCadastroInput>,
  now: Date,
) {
  const changedFields = fieldLabels
    .filter(({ key }) => getComparableValue(currentRecord, key) !== nextData[key])
    .map(({ label }) => label);

  const timestamp = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  })
    .format(now)
    .replace(",", " as");

  if (changedFields.length === 0) {
    return `Ultima alteracao em ${timestamp} - sem mudancas nos campos do cadastro`;
  }

  return `Ultima alteracao em ${timestamp} - alterados: ${changedFields.join(", ")}`;
}

function getComparableValue(
  currentRecord: TaxistaCadastroRecord,
  key: keyof ReturnType<typeof normalizeTaxistaCadastroInput>,
) {
  switch (key) {
    case "name":
      return currentRecord.name;
    case "cpf":
      return currentRecord.cpf;
    case "telefone":
      return currentRecord.telefone;
    case "endereco":
      return currentRecord.endereco;
    case "selo":
      return currentRecord.selo;
    case "ponto":
      return currentRecord.ponto;
    case "placa":
      return currentRecord.placa;
    case "modeloVeiculo":
      return currentRecord.modeloVeiculo;
    case "pressaoKgfM2":
      return currentRecord.pressaoKgfM2;
    case "numeroTaximetro":
      return currentRecord.numeroTaximetro;
    case "modeloTaximetro":
      return currentRecord.modeloTaximetro;
    case "constante":
      return currentRecord.constante;
    case "inmetro":
      return currentRecord.inmetro;
    case "instalacao":
      return currentRecord.instalacao;
    case "trocaTaximetro":
      return currentRecord.trocaTaximetro;
    case "pneu":
      return currentRecord.pneu;
    case "deca":
      return currentRecord.deca;
    case "lacreModulo":
      return currentRecord.lacreModulo;
    case "lacreTaxi":
      return currentRecord.lacreTaxi;
    case "modulo":
      return currentRecord.modulo;
    case "cinta":
      return currentRecord.cinta;
    case "colocado":
      return currentRecord.colocado;
    case "retirado":
      return currentRecord.retirado;
  }
}

export type TaxistaCadastroService = ReturnType<
  typeof createTaxistaCadastroService
>;

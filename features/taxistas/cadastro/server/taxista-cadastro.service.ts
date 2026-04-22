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
  TaxistaCadastroFormValues,
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
    listTaxistas() {
      return repository.findMany();
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

export type TaxistaCadastroService = ReturnType<
  typeof createTaxistaCadastroService
>;

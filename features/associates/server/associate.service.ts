import {
  SqliteAssociateRepository,
  type AssociateRepository,
} from "@/features/associates/server/associate.repository";
import {
  SqliteAssociateProfileRepository,
  createEmptyAssociateProfile,
  type AssociateProfileRepository,
} from "@/features/associates/server/associate-profile.repository";
import {
  validateAssociateFilters,
  validateCreateAssociateInput,
  validateUpdateAssociateInput,
} from "@/features/associates/lib/associate.validators";
import type {
  Associate,
  AssociateCategoryCounts,
  AssociateFilters,
  AssociateProfileData,
  AssociateStatusCounts,
  CreateAssociateInput,
  UpdateAssociateInput,
} from "@/features/associates/types";

export class AssociateValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AssociateValidationError";
  }
}

export class AssociateConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AssociateConflictError";
  }
}

export class AssociateNotFoundError extends Error {
  constructor(message = "ASSOCIATE_NOT_FOUND") {
    super(message);
    this.name = "AssociateNotFoundError";
  }
}

type AssociateServiceOptions = {
  repository?: AssociateRepository;
  profileRepository?: AssociateProfileRepository;
};

export function createAssociateService(options: AssociateServiceOptions = {}) {
  const repository = options.repository ?? new SqliteAssociateRepository();
  const profileRepository =
    options.profileRepository ?? new SqliteAssociateProfileRepository();

  return {
    listAssociates(filters?: AssociateFilters) {
      if (!filters) {
        return repository.findMany();
      }

      const validation = validateAssociateFilters(filters);

      if (!validation.success) {
        throw new AssociateValidationError(getFirstErrorMessage(validation.errors));
      }

      return repository.findMany(validation.data);
    },

    countAllAssociates() {
      return repository.countAll();
    },

    countByStatus(): Promise<AssociateStatusCounts> {
      return repository.countByStatus();
    },

    countByCategory(): Promise<AssociateCategoryCounts> {
      return repository.countByCategory();
    },

    async getAssociateById(id: string) {
      const associate = await getAssociateById(repository, id);
      return hydrateAssociateProfile(profileRepository, associate);
    },

    async createAssociate(input: CreateAssociateInput) {
      const validation = validateCreateAssociateInput(input);

      if (!validation.success) {
        throw new AssociateValidationError(getFirstErrorMessage(validation.errors));
      }

      await assertCpfAvailable(repository, validation.data.cpf);
      await assertRegistrationNumberAvailable(
        repository,
        validation.data.registrationNumber,
      );

      const createdAssociate = await repository.create(validation.data);
      const savedProfile = await profileRepository.upsertByAssociateId(
        createdAssociate.id,
        extractAssociateProfileData(validation.data),
      );

      return mergeAssociateWithProfile(createdAssociate, savedProfile);
    },

    async updateAssociate(id: string, input: UpdateAssociateInput) {
      const associateId = normalizeRequiredId(id);
      const existingAssociate = await getAssociateById(repository, associateId);
      const validation = validateUpdateAssociateInput(input);

      if (!validation.success) {
        throw new AssociateValidationError(getFirstErrorMessage(validation.errors));
      }

      if (
        validation.data.cpf &&
        validation.data.cpf !== existingAssociate.cpf
      ) {
        await assertCpfAvailable(repository, validation.data.cpf, existingAssociate.id);
      }

      if (
        validation.data.registrationNumber &&
        validation.data.registrationNumber !== existingAssociate.registrationNumber
      ) {
        await assertRegistrationNumberAvailable(
          repository,
          validation.data.registrationNumber,
          existingAssociate.id,
        );
      }

      const updatedAssociate = await repository.update(associateId, validation.data);
      const existingProfile =
        (await profileRepository.findByAssociateId(associateId)) ??
        createEmptyAssociateProfile();
      const savedProfile = await profileRepository.upsertByAssociateId(
        associateId,
        {
          ...existingProfile,
          ...extractAssociateProfileData(validation.data),
        },
      );

      return mergeAssociateWithProfile(updatedAssociate, savedProfile);
    },

    async deleteAssociate(id: string) {
      const associateId = normalizeRequiredId(id);
      await getAssociateById(repository, associateId);
      await profileRepository.removeByAssociateId(associateId);
      await repository.remove(associateId);
    },
  };
}

async function getAssociateById(repository: AssociateRepository, id: string) {
  const associateId = normalizeRequiredId(id);
  const associate = await repository.findById(associateId);

  if (!associate) {
    throw new AssociateNotFoundError();
  }

  return associate;
}

async function hydrateAssociateProfile(
  profileRepository: AssociateProfileRepository,
  associate: Associate,
) {
  const profile =
    (await profileRepository.findByAssociateId(associate.id)) ??
    createEmptyAssociateProfile();

  return mergeAssociateWithProfile(associate, profile);
}

async function assertCpfAvailable(
  repository: AssociateRepository,
  cpf: string,
  currentAssociateId?: string,
) {
  const existingAssociate = await repository.findByCpf(cpf);

  if (existingAssociate && existingAssociate.id !== currentAssociateId) {
    throw new AssociateConflictError("ASSOCIATE_CPF_ALREADY_EXISTS");
  }
}

async function assertRegistrationNumberAvailable(
  repository: AssociateRepository,
  registrationNumber: string,
  currentAssociateId?: string,
) {
  const existingAssociate = await repository.findByRegistrationNumber(
    registrationNumber,
  );

  if (existingAssociate && existingAssociate.id !== currentAssociateId) {
    throw new AssociateConflictError(
      "ASSOCIATE_REGISTRATION_NUMBER_ALREADY_EXISTS",
    );
  }
}

function normalizeRequiredId(id: string) {
  const normalizedValue = id.trim();

  if (!normalizedValue) {
    throw new AssociateValidationError("ASSOCIATE_ID_REQUIRED");
  }

  return normalizedValue;
}

function getFirstErrorMessage(errors: Record<string, string | undefined>) {
  for (const message of Object.values(errors)) {
    if (message) {
      return message;
    }
  }

  return "Dados inválidos para o associado.";
}

function mergeAssociateWithProfile(
  associate: Associate,
  profile: AssociateProfileData,
): Associate {
  return {
    ...associate,
    ...profile,
  };
}

function extractAssociateProfileData(
  input: Partial<CreateAssociateInput> | Partial<UpdateAssociateInput>,
): AssociateProfileData {
  return {
    modalidadeAssociado: input.modalidadeAssociado ?? null,
    cnpjEmpresa: input.cnpjEmpresa ?? null,
    nomeEmpresa: input.nomeEmpresa ?? null,
    enderecoCompleto: input.enderecoCompleto ?? null,
    bairro: input.bairro ?? null,
    cidade: input.cidade ?? null,
    estado: input.estado ?? null,
    cep: input.cep ?? null,
    profissao: input.profissao ?? null,
    sexo: input.sexo ?? null,
    dataNascimento: input.dataNascimento ?? null,
    nacionalidade: input.nacionalidade ?? null,
    naturalidade: input.naturalidade ?? null,
    rg: input.rg ?? null,
    cnh: input.cnh ?? null,
    estadoCivil: input.estadoCivil ?? null,
    nomePai: input.nomePai ?? null,
    nomeMae: input.nomeMae ?? null,
    dependentes: input.dependentes ?? null,
    grauParentesco: input.grauParentesco ?? null,
    telefone: input.telefone ?? null,
    celular: input.celular ?? null,
    email: input.email ?? null,
    observacoes: input.observacoes ?? null,
    situacaoFinanceira: input.situacaoFinanceira ?? null,
    situacaoDocumental: input.situacaoDocumental ?? null,
    historicoResumo: input.historicoResumo ?? null,
    fotoUrl: input.fotoUrl ?? null,
  };
}

export type AssociateService = ReturnType<typeof createAssociateService>;
export type {
  Associate,
  AssociateCategoryCounts,
  AssociateFilters,
  AssociateStatusCounts,
  CreateAssociateInput,
  UpdateAssociateInput,
};

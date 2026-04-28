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
import type { DatabaseAdapter } from "@/lib/database/adapter";
import { getDatabaseAdapter } from "@/lib/database/provider";
import { createSessionDatabaseAdapter } from "@/lib/database/session-adapter";

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
  adapter?: DatabaseAdapter;
  repository?: AssociateRepository;
  profileRepository?: AssociateProfileRepository;
  repositoryFactory?: (adapter: DatabaseAdapter) => AssociateRepository;
  profileRepositoryFactory?: (adapter: DatabaseAdapter) => AssociateProfileRepository;
};

export function createAssociateService(options: AssociateServiceOptions = {}) {
  const adapter = options.adapter ?? getDatabaseAdapter();
  const repositoryFactory =
    options.repositoryFactory ??
    ((scopedAdapter: DatabaseAdapter) => new SqliteAssociateRepository(scopedAdapter));
  const profileRepositoryFactory =
    options.profileRepositoryFactory ??
    ((scopedAdapter: DatabaseAdapter) => new SqliteAssociateProfileRepository(scopedAdapter));
  const repository = options.repository ?? repositoryFactory(adapter);
  const profileRepository =
    options.profileRepository ?? profileRepositoryFactory(adapter);
  const canUseScopedTransaction = !options.repository && !options.profileRepository;

  async function runWriteOperation<T>(
    operation: (repositories: {
      repository: AssociateRepository;
      profileRepository: AssociateProfileRepository;
    }) => Promise<T>,
  ) {
    if (!canUseScopedTransaction) {
      return operation({
        repository,
        profileRepository,
      });
    }

    return adapter.write(async (session) => {
      const scopedAdapter = createSessionDatabaseAdapter(adapter.provider, session);

      return operation({
        repository: repositoryFactory(scopedAdapter),
        profileRepository: profileRepositoryFactory(scopedAdapter),
      });
    });
  }

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

    countAssociates(filters?: AssociateFilters) {
      if (!filters) {
        return repository.countAll();
      }

      const validation = validateAssociateFilters(filters);

      if (!validation.success) {
        throw new AssociateValidationError(getFirstErrorMessage(validation.errors));
      }

      return repository.countMany(validation.data);
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

      return runWriteOperation(async ({ repository, profileRepository }) => {
        await assertCpfAvailable(repository, validation.data.cpf);
        await assertRegistrationNumberAvailable(
          repository,
          validation.data.registrationNumber,
        );
        await assertRgAvailable(profileRepository, validation.data.rg);
        await assertCnhAvailable(profileRepository, validation.data.cnh);
        await assertCompanyCnpjAvailable(
          profileRepository,
          validation.data.cnpjEmpresa,
        );

        const createdAssociate = await repository.create(validation.data);
        const savedProfile = await profileRepository.upsertByAssociateId(
          createdAssociate.id,
          extractAssociateProfileData(validation.data),
        );

        return mergeAssociateWithProfile(createdAssociate, savedProfile);
      });
    },

    async updateAssociate(id: string, input: UpdateAssociateInput) {
      const associateId = normalizeRequiredId(id);
      const validation = validateUpdateAssociateInput(input);

      if (!validation.success) {
        throw new AssociateValidationError(getFirstErrorMessage(validation.errors));
      }

      return runWriteOperation(async ({ repository, profileRepository }) => {
        const existingAssociate = await getAssociateById(repository, associateId);

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

        const existingProfile =
          (await profileRepository.findByAssociateId(associateId)) ??
          createEmptyAssociateProfile();
        const nextRg =
          validation.data.rg !== undefined ? validation.data.rg : existingProfile.rg;
        const nextCnh =
          validation.data.cnh !== undefined ? validation.data.cnh : existingProfile.cnh;
        const nextCompanyCnpj =
          validation.data.cnpjEmpresa !== undefined
            ? validation.data.cnpjEmpresa
            : existingProfile.cnpjEmpresa;

        await assertRgAvailable(profileRepository, nextRg, existingAssociate.id);
        await assertCnhAvailable(profileRepository, nextCnh, existingAssociate.id);
        await assertCompanyCnpjAvailable(
          profileRepository,
          nextCompanyCnpj,
          existingAssociate.id,
        );

        const updatedAssociate = await repository.update(associateId, validation.data);
        const savedProfile = await profileRepository.upsertByAssociateId(
          associateId,
          {
            ...existingProfile,
            ...extractAssociateProfileData(validation.data),
          },
        );

        return mergeAssociateWithProfile(updatedAssociate, savedProfile);
      });
    },

    async deleteAssociate(id: string) {
      const associateId = normalizeRequiredId(id);

      await runWriteOperation(async ({ repository }) => {
        await getAssociateById(repository, associateId);
        await repository.remove(associateId);
      });
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

async function assertRgAvailable(
  profileRepository: AssociateProfileRepository,
  rg: string | null | undefined,
  currentAssociateId?: string,
) {
  if (!rg) {
    return;
  }

  const existingProfile = await profileRepository.findByRg(rg);

  if (existingProfile && existingProfile.associateId !== currentAssociateId) {
    throw new AssociateConflictError("ASSOCIATE_RG_ALREADY_EXISTS");
  }
}

async function assertCnhAvailable(
  profileRepository: AssociateProfileRepository,
  cnh: string | null | undefined,
  currentAssociateId?: string,
) {
  if (!cnh) {
    return;
  }

  const existingProfile = await profileRepository.findByCnh(cnh);

  if (existingProfile && existingProfile.associateId !== currentAssociateId) {
    throw new AssociateConflictError("ASSOCIATE_CNH_ALREADY_EXISTS");
  }
}

async function assertCompanyCnpjAvailable(
  profileRepository: AssociateProfileRepository,
  cnpjEmpresa: string | null | undefined,
  currentAssociateId?: string,
) {
  if (!cnpjEmpresa) {
    return;
  }

  const existingProfile = await profileRepository.findByCompanyCnpj(cnpjEmpresa);

  if (existingProfile && existingProfile.associateId !== currentAssociateId) {
    throw new AssociateConflictError("ASSOCIATE_COMPANY_CNPJ_ALREADY_EXISTS");
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

  return "Dados invalidos para o associado.";
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

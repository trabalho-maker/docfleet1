import {
  SqliteAssociateRepository,
  type AssociateRepository,
} from "@/src/features/associates/server/associate.repository";
import {
  validateAssociateFilters,
  validateCreateAssociateInput,
  validateUpdateAssociateInput,
} from "@/src/features/associates/lib/associate.validators";
import type {
  Associate,
  AssociateCategoryCounts,
  AssociateFilters,
  AssociateStatusCounts,
  CreateAssociateInput,
  UpdateAssociateInput,
} from "@/src/features/associates/types";

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
};

export function createAssociateService(options: AssociateServiceOptions = {}) {
  const repository = options.repository ?? new SqliteAssociateRepository();

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

    getAssociateById(id: string) {
      return getAssociateById(repository, id);
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

      return repository.create(validation.data);
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

      return repository.update(associateId, validation.data);
    },

    async deleteAssociate(id: string) {
      const associateId = normalizeRequiredId(id);
      await getAssociateById(repository, associateId);
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

  return "Dados invalidos para o associado.";
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

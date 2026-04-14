import {
  hasExceededMaxLength,
  normalizePlainTextInput,
} from "@/lib/security/input";
import {
  associateCategories,
  associatesDefaults,
  associateStatuses,
} from "@/features/associates/constants";
import type {
  AssociateCategory,
  AssociateFieldErrors,
  AssociateFilters,
  AssociateStatus,
  CreateAssociateInput,
  UpdateAssociateInput,
} from "@/features/associates/types";

const MAX_ASSOCIATE_NAME_LENGTH = 160;
const MAX_ASSOCIATE_CPF_LENGTH = 11;
const MAX_ASSOCIATE_REGISTRATION_NUMBER_LENGTH = 40;
const MAX_FILTER_SEARCH_LENGTH = 160;
const MAX_PAGE_SIZE = 100;

type AssociateFiltersErrors = Partial<Record<keyof AssociateFilters, string>>;

export type CreateAssociateValidationResult =
  | {
      success: true;
      data: CreateAssociateInput;
    }
  | {
      success: false;
      errors: AssociateFieldErrors;
    };

export type UpdateAssociateValidationResult =
  | {
      success: true;
      data: UpdateAssociateInput;
    }
  | {
      success: false;
      errors: AssociateFieldErrors;
    };

export type AssociateFiltersValidationResult =
  | {
      success: true;
      data: AssociateFilters;
    }
  | {
      success: false;
      errors: AssociateFiltersErrors;
    };

export function normalizeAssociateCpf(value: string) {
  return value.replace(/\D/g, "");
}

export function isAssociateCategory(value: string): value is AssociateCategory {
  return associateCategories.includes(value as AssociateCategory);
}

export function isAssociateStatus(value: string): value is AssociateStatus {
  return associateStatuses.includes(value as AssociateStatus);
}

export function validateAssociateCpf(value: string) {
  const cpf = normalizeAssociateCpf(value);

  if (cpf.length !== MAX_ASSOCIATE_CPF_LENGTH) {
    return false;
  }

  if (/^(\d)\1+$/.test(cpf)) {
    return false;
  }

  const digits = cpf.split("").map(Number);
  const firstCheckDigit = calculateCpfCheckDigit(digits.slice(0, 9), 10);
  const secondCheckDigit = calculateCpfCheckDigit(digits.slice(0, 10), 11);

  return digits[9] === firstCheckDigit && digits[10] === secondCheckDigit;
}

export function validateCreateAssociateInput(
  input: CreateAssociateInput,
): CreateAssociateValidationResult {
  const errors: AssociateFieldErrors = {};
  const name = normalizeName(input.name, errors);
  const cpf = normalizeAndValidateCpf(input.cpf, errors);
  const category = validateCategory(input.category, errors);
  const registrationNumber = normalizeRegistrationNumber(
    input.registrationNumber,
    errors,
  );
  const status = validateStatus(input.status, errors);
  const admissionDate = normalizeAndValidateAdmissionDate(input.admissionDate, errors);

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      errors,
    };
  }

  return {
    success: true,
    data: {
      name,
      cpf,
      category,
      registrationNumber,
      status,
      admissionDate,
    },
  };
}

export function validateUpdateAssociateInput(
  input: UpdateAssociateInput,
): UpdateAssociateValidationResult {
  const errors: AssociateFieldErrors = {};
  const data: UpdateAssociateInput = {};

  if (input.name !== undefined) {
    data.name = normalizeName(input.name, errors);
  }

  if (input.cpf !== undefined) {
    data.cpf = normalizeAndValidateCpf(input.cpf, errors);
  }

  if (input.category !== undefined) {
    data.category = validateCategory(input.category, errors);
  }

  if (input.registrationNumber !== undefined) {
    data.registrationNumber = normalizeRegistrationNumber(
      input.registrationNumber,
      errors,
    );
  }

  if (input.status !== undefined) {
    data.status = validateStatus(input.status, errors);
  }

  if (input.admissionDate !== undefined) {
    data.admissionDate = normalizeAndValidateAdmissionDate(input.admissionDate, errors);
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      errors,
    };
  }

  return {
    success: true,
    data,
  };
}

export function validateAssociateFilters(
  filters: AssociateFilters,
): AssociateFiltersValidationResult {
  const errors: AssociateFiltersErrors = {};
  const normalizedFilters: AssociateFilters = {};

  if (filters.search !== undefined) {
    const normalizedSearch = normalizePlainTextInput(filters.search);

    if (!normalizedSearch) {
      errors.search = "Informe um termo de busca valido.";
    } else if (hasExceededMaxLength(normalizedSearch, MAX_FILTER_SEARCH_LENGTH)) {
      errors.search = `Informe uma busca com no maximo ${MAX_FILTER_SEARCH_LENGTH} caracteres.`;
    } else if (/^[\d.\-\/\s]+$/.test(normalizedSearch)) {
      normalizedFilters.cpf = normalizeAssociateCpf(normalizedSearch);
    } else {
      normalizedFilters.search = normalizedSearch;
    }
  }

  if (filters.cpf !== undefined) {
    const normalizedCpf = normalizeAssociateCpf(filters.cpf);

    if (!normalizedCpf) {
      errors.cpf = "Informe um CPF valido para filtro.";
    } else {
      normalizedFilters.cpf = normalizedCpf;
    }
  }

  if (filters.category !== undefined) {
    if (!isAssociateCategory(filters.category)) {
      errors.category = "Informe uma categoria valida.";
    } else {
      normalizedFilters.category = filters.category;
    }
  }

  if (filters.status !== undefined) {
    if (!isAssociateStatus(filters.status)) {
      errors.status = "Informe um status valido.";
    } else {
      normalizedFilters.status = filters.status;
    }
  }

  if (filters.registrationNumber !== undefined) {
    const normalizedRegistrationNumber = normalizePlainTextInput(
      filters.registrationNumber,
    );

    if (!normalizedRegistrationNumber) {
      errors.registrationNumber = "Informe uma matricula valida para filtro.";
    } else if (
      hasExceededMaxLength(
        normalizedRegistrationNumber,
        MAX_ASSOCIATE_REGISTRATION_NUMBER_LENGTH,
      )
    ) {
      errors.registrationNumber = `Informe uma matricula com no maximo ${MAX_ASSOCIATE_REGISTRATION_NUMBER_LENGTH} caracteres.`;
    } else {
      normalizedFilters.registrationNumber = normalizedRegistrationNumber;
    }
  }

  if (filters.admissionDateFrom !== undefined) {
    if (!isValidIsoDate(filters.admissionDateFrom.trim())) {
      errors.admissionDateFrom = "Informe uma data inicial valida.";
    } else {
      normalizedFilters.admissionDateFrom = filters.admissionDateFrom.trim();
    }
  }

  if (filters.admissionDateTo !== undefined) {
    if (!isValidIsoDate(filters.admissionDateTo.trim())) {
      errors.admissionDateTo = "Informe uma data final valida.";
    } else {
      normalizedFilters.admissionDateTo = filters.admissionDateTo.trim();
    }
  }

  const normalizedPage = normalizePositiveInteger(filters.page);
  const normalizedPageSize = normalizePositiveInteger(filters.pageSize);

  if (filters.page !== undefined && normalizedPage === null) {
    errors.page = "Informe uma pagina valida.";
  } else {
    normalizedFilters.page = normalizedPage ?? associatesDefaults.page;
  }

  if (filters.pageSize !== undefined && normalizedPageSize === null) {
    errors.pageSize = "Informe um tamanho de pagina valido.";
  } else {
    normalizedFilters.pageSize = Math.min(
      normalizedPageSize ?? associatesDefaults.pageSize,
      MAX_PAGE_SIZE,
    );
  }

  if (
    normalizedFilters.admissionDateFrom &&
    normalizedFilters.admissionDateTo &&
    normalizedFilters.admissionDateFrom > normalizedFilters.admissionDateTo
  ) {
    errors.admissionDateTo = "A data final nao pode ser anterior a data inicial.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      errors,
    };
  }

  return {
    success: true,
    data: normalizedFilters,
  };
}

function normalizeName(value: string, errors: AssociateFieldErrors) {
  const normalizedValue = normalizePlainTextInput(value);

  if (normalizedValue.length < 3) {
    errors.name = "Informe um nome com pelo menos 3 caracteres.";
  } else if (hasExceededMaxLength(normalizedValue, MAX_ASSOCIATE_NAME_LENGTH)) {
    errors.name = `Informe um nome com no maximo ${MAX_ASSOCIATE_NAME_LENGTH} caracteres.`;
  }

  return normalizedValue;
}

function normalizeAndValidateCpf(value: string, errors: AssociateFieldErrors) {
  const normalizedCpf = normalizeAssociateCpf(value);

  if (!normalizedCpf) {
    errors.cpf = "Informe um CPF.";
  } else if (!validateAssociateCpf(normalizedCpf)) {
    errors.cpf = "Informe um CPF valido.";
  }

  return normalizedCpf;
}

function normalizeRegistrationNumber(value: string, errors: AssociateFieldErrors) {
  const normalizedValue = normalizePlainTextInput(value);

  if (!normalizedValue) {
    errors.registrationNumber = "Informe uma matricula.";
  } else if (
    hasExceededMaxLength(normalizedValue, MAX_ASSOCIATE_REGISTRATION_NUMBER_LENGTH)
  ) {
    errors.registrationNumber = `Informe uma matricula com no maximo ${MAX_ASSOCIATE_REGISTRATION_NUMBER_LENGTH} caracteres.`;
  }

  return normalizedValue;
}

function validateCategory(
  value: CreateAssociateInput["category"] | UpdateAssociateInput["category"],
  errors: AssociateFieldErrors,
) {
  if (!value || !isAssociateCategory(value)) {
    errors.category = "Informe uma categoria valida.";
  }

  return value as AssociateCategory;
}

function validateStatus(
  value: CreateAssociateInput["status"] | UpdateAssociateInput["status"],
  errors: AssociateFieldErrors,
) {
  if (!value || !isAssociateStatus(value)) {
    errors.status = "Informe um status valido.";
  }

  return value as AssociateStatus;
}

function normalizeAndValidateAdmissionDate(value: string, errors: AssociateFieldErrors) {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    errors.admissionDate = "Informe a data de admissao.";
  } else if (!isValidIsoDate(normalizedValue)) {
    errors.admissionDate = "Informe uma data de admissao valida.";
  }

  return normalizedValue;
}

function normalizePositiveInteger(value: number | undefined) {
  if (value === undefined) {
    return undefined;
  }

  if (!Number.isInteger(value) || value < 1) {
    return null;
  }

  return value;
}

function isValidIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(`${value}T00:00:00Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
  );
}

function calculateCpfCheckDigit(baseDigits: number[], factor: number) {
  const total = baseDigits.reduce(
    (sum, digit, index) => sum + digit * (factor - index),
    0,
  );
  const remainder = (total * 10) % 11;

  return remainder === 10 ? 0 : remainder;
}


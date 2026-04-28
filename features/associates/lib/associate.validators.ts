import {
  hasExceededMaxLength,
  normalizeEmailInput,
  normalizePlainTextInput,
} from "@/lib/security/input";
import {
  normalizeAssociateCnh,
  normalizeAssociateCompanyCnpj,
  normalizeAssociateRg,
} from "@/features/associates/lib/associate-profile-identifiers";
import {
  associateCategories,
  associatesDefaults,
  associateCivilStates,
  associateEditableStatuses,
  associateProfileCategories,
  associateSexOptions,
  associateStatuses,
  brazilianStates,
} from "@/features/associates/constants";
import type {
  AssociateCategory,
  AssociateFieldErrors,
  AssociateFilters,
  AssociateFormValues,
  AssociateProfileCategory,
  AssociateProfileData,
  AssociateSex,
  AssociateStatus,
  CreateAssociateInput,
  UpdateAssociateInput,
} from "@/features/associates/types";

const MAX_ASSOCIATE_NAME_LENGTH = 160;
const MAX_ASSOCIATE_CPF_LENGTH = 11;
const MAX_ASSOCIATE_REGISTRATION_NUMBER_LENGTH = 40;
const MAX_FILTER_SEARCH_LENGTH = 160;
const MAX_PAGE_SIZE = 100;
const MAX_SHORT_TEXT_LENGTH = 120;
const MAX_MEDIUM_TEXT_LENGTH = 180;
const MAX_LONG_TEXT_LENGTH = 255;
const MAX_NOTES_LENGTH = 2000;

type AssociateFiltersErrors = Partial<Record<keyof AssociateFilters, string>>;

type AssociateInputLike = Partial<AssociateFormValues> | Partial<CreateAssociateInput>;

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

function isEditableAssociateStatus(
  value: string,
): value is (typeof associateEditableStatuses)[number] {
  return associateEditableStatuses.includes(
    value as (typeof associateEditableStatuses)[number],
  );
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
  input: AssociateInputLike,
): CreateAssociateValidationResult {
  const errors: AssociateFieldErrors = {};
  const name = normalizeName(String(input.name ?? ""), errors);
  const cpf = normalizeAndValidateCpf(String(input.cpf ?? ""), errors);
  const category = validateCategory(
    typeof input.category === "string" ? input.category : "",
    errors,
  );
  const registrationNumber = normalizeRegistrationNumber(
    String(input.registrationNumber ?? ""),
    errors,
  );
  const status = validateStatus(
    typeof input.status === "string" ? input.status : "",
    errors,
  );
  const admissionDate = normalizeAndValidateAdmissionDate(
    String(input.admissionDate ?? ""),
    errors,
  );
  const profile = normalizeAssociateProfile(input, errors);

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
      ...profile,
    },
  };
}

export function validateUpdateAssociateInput(
  input: AssociateInputLike,
): UpdateAssociateValidationResult {
  const errors: AssociateFieldErrors = {};
  const data: UpdateAssociateInput = {};

  if (input.name !== undefined) {
    data.name = normalizeName(String(input.name), errors);
  }

  if (input.cpf !== undefined) {
    data.cpf = normalizeAndValidateCpf(String(input.cpf), errors);
  }

  if (input.category !== undefined) {
    data.category = validateCategory(String(input.category), errors);
  }

  if (input.registrationNumber !== undefined) {
    data.registrationNumber = normalizeRegistrationNumber(
      String(input.registrationNumber),
      errors,
    );
  }

  if (input.status !== undefined) {
    data.status = validateStatus(String(input.status), errors);
  }

  if (input.admissionDate !== undefined) {
    data.admissionDate = normalizeAndValidateAdmissionDate(
      String(input.admissionDate),
      errors,
    );
  }

  Object.assign(data, normalizeAssociateProfile(input, errors));

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
      errors.search = "Informe um termo de busca válido.";
    } else if (hasExceededMaxLength(normalizedSearch, MAX_FILTER_SEARCH_LENGTH)) {
      errors.search = `Informe uma busca com no máximo ${MAX_FILTER_SEARCH_LENGTH} caracteres.`;
    } else if (/^[\d.\-\/\s]+$/.test(normalizedSearch)) {
      normalizedFilters.cpf = normalizeAssociateCpf(normalizedSearch);
    } else {
      normalizedFilters.search = normalizedSearch;
    }
  }

  if (filters.cpf !== undefined) {
    const normalizedCpf = normalizeAssociateCpf(filters.cpf);

    if (!normalizedCpf) {
      errors.cpf = "Informe um CPF válido para filtro.";
    } else {
      normalizedFilters.cpf = normalizedCpf;
    }
  }

  if (filters.category !== undefined) {
    if (!isAssociateCategory(filters.category)) {
      errors.category = "Informe uma categoria válida.";
    } else {
      normalizedFilters.category = filters.category;
    }
  }

  if (filters.status !== undefined) {
    if (!isAssociateStatus(filters.status)) {
      errors.status = "Informe um status válido.";
    } else {
      normalizedFilters.status = filters.status;
    }
  }

  if (filters.registrationNumber !== undefined) {
    const normalizedRegistrationNumber = normalizePlainTextInput(
      filters.registrationNumber,
    );

    if (!normalizedRegistrationNumber) {
      errors.registrationNumber = "Informe uma matrícula válida para filtro.";
    } else if (
      hasExceededMaxLength(
        normalizedRegistrationNumber,
        MAX_ASSOCIATE_REGISTRATION_NUMBER_LENGTH,
      )
    ) {
      errors.registrationNumber = `Informe uma matrícula com no máximo ${MAX_ASSOCIATE_REGISTRATION_NUMBER_LENGTH} caracteres.`;
    } else {
      normalizedFilters.registrationNumber = normalizedRegistrationNumber;
    }
  }

  if (filters.admissionDateFrom !== undefined) {
    if (!isValidIsoDate(filters.admissionDateFrom.trim())) {
      errors.admissionDateFrom = "Informe uma data inicial válida.";
    } else {
      normalizedFilters.admissionDateFrom = filters.admissionDateFrom.trim();
    }
  }

  if (filters.admissionDateTo !== undefined) {
    if (!isValidIsoDate(filters.admissionDateTo.trim())) {
      errors.admissionDateTo = "Informe uma data final válida.";
    } else {
      normalizedFilters.admissionDateTo = filters.admissionDateTo.trim();
    }
  }

  const normalizedPage = normalizePositiveInteger(filters.page);
  const normalizedPageSize = normalizePositiveInteger(filters.pageSize);

  if (filters.page !== undefined && normalizedPage === null) {
    errors.page = "Informe uma página válida.";
  } else {
    normalizedFilters.page = normalizedPage ?? associatesDefaults.page;
  }

  if (filters.pageSize !== undefined && normalizedPageSize === null) {
    errors.pageSize = "Informe um tamanho de página válido.";
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
    errors.admissionDateTo = "A data final não pode ser anterior à data inicial.";
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

function normalizeAssociateProfile(
  input: AssociateInputLike,
  errors: AssociateFieldErrors,
): AssociateProfileData {
  const modalidadeAssociado = normalizeOptionalProfileCategory(
    input.modalidadeAssociado,
    errors,
  );
  const cnpjEmpresa = normalizeOptionalCompanyDocument(input.cnpjEmpresa, errors);
  const nomeEmpresa = normalizeOptionalText(
    input.nomeEmpresa,
    "nomeEmpresa",
    errors,
    MAX_ASSOCIATE_NAME_LENGTH,
  );

  if (modalidadeAssociado === "CNPJ") {
    if (!cnpjEmpresa) {
      errors.cnpjEmpresa = "Informe o CNPJ da empresa.";
    }

    if (!nomeEmpresa) {
      errors.nomeEmpresa = "Informe o nome da empresa.";
    }
  }

  return {
    modalidadeAssociado,
    cnpjEmpresa,
    nomeEmpresa,
    enderecoCompleto: normalizeOptionalText(
      input.enderecoCompleto,
      "enderecoCompleto",
      errors,
      MAX_LONG_TEXT_LENGTH,
    ),
    bairro: normalizeOptionalText(input.bairro, "bairro", errors, MAX_SHORT_TEXT_LENGTH),
    cidade: normalizeOptionalText(input.cidade, "cidade", errors, MAX_SHORT_TEXT_LENGTH),
    estado: normalizeOptionalState(input.estado, errors),
    cep: normalizeOptionalCep(input.cep, errors),
    profissao: normalizeOptionalText(
      input.profissao,
      "profissao",
      errors,
      MAX_SHORT_TEXT_LENGTH,
    ),
    sexo: normalizeOptionalSex(input.sexo, errors),
    dataNascimento: normalizeOptionalDate(
      input.dataNascimento,
      "dataNascimento",
      "Informe uma data de nascimento válida.",
      errors,
    ),
    nacionalidade: normalizeOptionalText(
      input.nacionalidade,
      "nacionalidade",
      errors,
      MAX_SHORT_TEXT_LENGTH,
    ),
    naturalidade: normalizeOptionalText(
      input.naturalidade,
      "naturalidade",
      errors,
      MAX_SHORT_TEXT_LENGTH,
    ),
    rg: normalizeOptionalRg(input.rg, errors),
    cnh: normalizeOptionalCnh(input.cnh, errors),
    estadoCivil: normalizeOptionalCivilState(input.estadoCivil, errors),
    nomePai: normalizeOptionalText(input.nomePai, "nomePai", errors, MAX_ASSOCIATE_NAME_LENGTH),
    nomeMae: normalizeOptionalText(input.nomeMae, "nomeMae", errors, MAX_ASSOCIATE_NAME_LENGTH),
    dependentes: normalizeOptionalText(
      input.dependentes,
      "dependentes",
      errors,
      MAX_SHORT_TEXT_LENGTH,
    ),
    grauParentesco: normalizeOptionalText(
      input.grauParentesco,
      "grauParentesco",
      errors,
      MAX_SHORT_TEXT_LENGTH,
    ),
    telefone: normalizeOptionalText(
      input.telefone,
      "telefone",
      errors,
      MAX_SHORT_TEXT_LENGTH,
    ),
    celular: normalizeOptionalText(input.celular, "celular", errors, MAX_SHORT_TEXT_LENGTH),
    email: normalizeOptionalEmail(input.email, errors),
    observacoes: normalizeOptionalLongText(
      input.observacoes,
      "observacoes",
      errors,
      MAX_NOTES_LENGTH,
    ),
    situacaoFinanceira: normalizeOptionalLongText(
      input.situacaoFinanceira,
      "situacaoFinanceira",
      errors,
      MAX_MEDIUM_TEXT_LENGTH,
    ),
    situacaoDocumental: normalizeOptionalLongText(
      input.situacaoDocumental,
      "situacaoDocumental",
      errors,
      MAX_MEDIUM_TEXT_LENGTH,
    ),
    historicoResumo: normalizeOptionalLongText(
      input.historicoResumo,
      "historicoResumo",
      errors,
      MAX_NOTES_LENGTH,
    ),
    fotoUrl: normalizeOptionalText(input.fotoUrl, "fotoUrl", errors, MAX_LONG_TEXT_LENGTH),
  };
}

function normalizeName(value: string, errors: AssociateFieldErrors) {
  const normalizedValue = normalizePlainTextInput(value);

  if (normalizedValue.length < 3) {
    errors.name = "Informe um nome com pelo menos 3 caracteres.";
  } else if (hasExceededMaxLength(normalizedValue, MAX_ASSOCIATE_NAME_LENGTH)) {
    errors.name = `Informe um nome com no máximo ${MAX_ASSOCIATE_NAME_LENGTH} caracteres.`;
  }

  return normalizedValue;
}

function normalizeAndValidateCpf(value: string, errors: AssociateFieldErrors) {
  const normalizedCpf = normalizeAssociateCpf(value);

  if (!normalizedCpf) {
    errors.cpf = "Informe um CPF.";
  } else if (!validateAssociateCpf(normalizedCpf)) {
    errors.cpf = "Informe um CPF válido.";
  }

  return normalizedCpf;
}

function normalizeRegistrationNumber(value: string, errors: AssociateFieldErrors) {
  const normalizedValue = normalizePlainTextInput(value);

  if (!normalizedValue) {
    errors.registrationNumber = "Informe uma matrícula.";
  } else if (
    hasExceededMaxLength(normalizedValue, MAX_ASSOCIATE_REGISTRATION_NUMBER_LENGTH)
  ) {
    errors.registrationNumber = `Informe uma matrícula com no máximo ${MAX_ASSOCIATE_REGISTRATION_NUMBER_LENGTH} caracteres.`;
  }

  return normalizedValue;
}

function validateCategory(value: string, errors: AssociateFieldErrors) {
  if (!value || !isAssociateCategory(value)) {
    errors.category = "Informe uma categoria válida.";
  }

  return value as AssociateCategory;
}

function validateStatus(value: string, errors: AssociateFieldErrors) {
  if (!value || !isEditableAssociateStatus(value)) {
    errors.status = "Informe um status válido.";
  }

  return value as AssociateStatus;
}

function normalizeAndValidateAdmissionDate(value: string, errors: AssociateFieldErrors) {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    errors.admissionDate = "Informe a data de admissão.";
  } else if (!isValidIsoDate(normalizedValue)) {
    errors.admissionDate = "Informe uma data de admissão válida.";
  }

  return normalizedValue;
}

function normalizeOptionalText(
  value: unknown,
  field: keyof AssociateFieldErrors,
  errors: AssociateFieldErrors,
  maxLength: number,
) {
  const normalizedValue = normalizePlainTextInput(String(value ?? ""));

  if (!normalizedValue) {
    return null;
  }

  if (hasExceededMaxLength(normalizedValue, maxLength)) {
    errors[field] = `Informe um valor com no máximo ${maxLength} caracteres.`;
  }

  return normalizedValue;
}

function normalizeOptionalProfileCategory(value: unknown, errors: AssociateFieldErrors) {
  const normalizedValue = normalizeAssociateProfileCategoryValue(
    normalizePlainTextInput(String(value ?? "")),
  );

  if (!normalizedValue) {
    return null;
  }

  if (!associateProfileCategories.includes(normalizedValue as AssociateProfileCategory)) {
    errors.modalidadeAssociado = "Informe uma categoria da ficha valida.";
  }

  return normalizedValue as AssociateProfileCategory;
}

function normalizeAssociateProfileCategoryValue(value: string) {
  if (!value) {
    return "";
  }

  const normalizedUpperValue = value.toUpperCase();

  if (normalizedUpperValue === "TAXI" || normalizedUpperValue === "TAXISTA") {
    return "TAXI";
  }

  if (normalizedUpperValue === "CAMINHAO" || normalizedUpperValue === "CAMINHÃO") {
    return "CAMINHAO";
  }

  if (
    normalizedUpperValue === "ESCOLAR" ||
    normalizedUpperValue === "TRANSPORTEESCOLAR" ||
    normalizedUpperValue === "TRANSPORTE_ESCOLAR"
  ) {
    return "ESCOLAR";
  }

  if (normalizedUpperValue === "CNPJ") {
    return "CNPJ";
  }

  return normalizedUpperValue;
}

function normalizeOptionalCompanyDocument(value: unknown, errors: AssociateFieldErrors) {
  const digits = normalizeAssociateCompanyCnpj(value);

  if (!digits) {
    return null;
  }

  if (digits.length !== 14) {
    errors.cnpjEmpresa = "Informe um CNPJ valido.";
  }

  return digits;
}

function normalizeOptionalRg(value: unknown, errors: AssociateFieldErrors) {
  const normalizedValue = normalizeAssociateRg(value);

  if (!normalizedValue) {
    return null;
  }

  if (hasExceededMaxLength(normalizedValue, MAX_SHORT_TEXT_LENGTH)) {
    errors.rg = `Informe um valor com no mÃ¡ximo ${MAX_SHORT_TEXT_LENGTH} caracteres.`;
  }

  return normalizedValue;
}

function normalizeOptionalCnh(value: unknown, errors: AssociateFieldErrors) {
  const normalizedValue = normalizeAssociateCnh(value);

  if (!normalizedValue) {
    return null;
  }

  if (hasExceededMaxLength(normalizedValue, MAX_SHORT_TEXT_LENGTH)) {
    errors.cnh = `Informe um valor com no mÃ¡ximo ${MAX_SHORT_TEXT_LENGTH} caracteres.`;
  }

  return normalizedValue;
}

function normalizeOptionalLongText(
  value: unknown,
  field: keyof AssociateFieldErrors,
  errors: AssociateFieldErrors,
  maxLength: number,
) {
  const normalizedValue = normalizeMultilineInput(String(value ?? ""));

  if (!normalizedValue) {
    return null;
  }

  if (hasExceededMaxLength(normalizedValue, maxLength)) {
    errors[field] = `Informe um texto com no máximo ${maxLength} caracteres.`;
  }

  return normalizedValue;
}

function normalizeOptionalEmail(value: unknown, errors: AssociateFieldErrors) {
  const rawValue = String(value ?? "").trim();

  if (!rawValue) {
    return null;
  }

  const normalizedValue = normalizeEmailInput(rawValue);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedValue)) {
    errors.email = "Informe um e-mail válido.";
  } else if (hasExceededMaxLength(normalizedValue, MAX_LONG_TEXT_LENGTH)) {
    errors.email = `Informe um e-mail com no máximo ${MAX_LONG_TEXT_LENGTH} caracteres.`;
  }

  return normalizedValue;
}

function normalizeOptionalDate(
  value: unknown,
  field: keyof AssociateFieldErrors,
  errorMessage: string,
  errors: AssociateFieldErrors,
) {
  const normalizedValue = String(value ?? "").trim();

  if (!normalizedValue) {
    return null;
  }

  if (!isValidIsoDate(normalizedValue)) {
    errors[field] = errorMessage;
  }

  return normalizedValue;
}

function normalizeOptionalCep(value: unknown, errors: AssociateFieldErrors) {
  const digits = String(value ?? "").replace(/\D/g, "");

  if (!digits) {
    return null;
  }

  if (digits.length !== 8) {
    errors.cep = "Informe um CEP válido.";
  }

  return digits;
}

function normalizeOptionalState(value: unknown, errors: AssociateFieldErrors) {
  const normalizedValue = normalizePlainTextInput(String(value ?? "")).toUpperCase();

  if (!normalizedValue) {
    return null;
  }

  if (!brazilianStates.includes(normalizedValue as (typeof brazilianStates)[number])) {
    errors.estado = "Informe uma UF válida.";
  }

  return normalizedValue;
}

function normalizeOptionalSex(value: unknown, errors: AssociateFieldErrors) {
  const normalizedValue = normalizePlainTextInput(String(value ?? "")).toUpperCase();

  if (!normalizedValue) {
    return null;
  }

  if (!associateSexOptions.includes(normalizedValue as AssociateSex)) {
    errors.sexo = "Informe um sexo válido.";
  }

  return normalizedValue as AssociateSex;
}

function normalizeOptionalCivilState(value: unknown, errors: AssociateFieldErrors) {
  const normalizedValue = normalizePlainTextInput(String(value ?? ""));

  if (!normalizedValue) {
    return null;
  }

  if (
    !associateCivilStates.includes(
      normalizedValue as (typeof associateCivilStates)[number],
    )
  ) {
    errors.estadoCivil = "Informe um estado civil válido.";
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

function normalizeMultilineInput(value: string) {
  return value
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

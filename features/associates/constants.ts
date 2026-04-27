import type {
  AssociateCategory,
  AssociateProfileCategory,
  AssociateSex,
  AssociateStatus,
} from "@/features/associates/types";

export const associateCategories: AssociateCategory[] = [
  "Titular",
  "Dependente",
  "Pensionista",
  "Contribuinte",
];

export const associateStatuses: AssociateStatus[] = [
  "Ativo",
  "Inativo",
  "Suspenso",
  "Bloqueado",
];

export const associateEditableStatuses = [
  "Ativo",
  "Inativo",
] as const satisfies ReadonlyArray<AssociateStatus>;

export const associateSexOptions: AssociateSex[] = ["M", "F"];

export const associateProfileCategories: AssociateProfileCategory[] = [
  "TAXI",
  "CAMINHAO",
  "ESCOLAR",
  "CNPJ",
];

export const associateCivilStates = [
  "Solteiro(a)",
  "Casado(a)",
  "União estável",
  "Divorciado(a)",
  "Viúvo(a)",
] as const;

export const brazilianStates = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;

export const associatesDefaults = {
  page: 1,
  pageSize: 20,
} as const;

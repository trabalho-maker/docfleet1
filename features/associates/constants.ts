import type { AssociateCategory, AssociateStatus } from "@/features/associates/types";

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

export const associatesDefaults = {
  page: 1,
  pageSize: 20,
} as const;


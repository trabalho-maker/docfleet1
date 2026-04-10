export type AssociateCategory =
  | "Titular"
  | "Dependente"
  | "Pensionista"
  | "Contribuinte";

export type AssociateStatus = "Ativo" | "Inativo" | "Suspenso" | "Bloqueado";

export type Associate = {
  id: string;
  name: string;
  cpf: string;
  category: AssociateCategory;
  registrationNumber: string;
  status: AssociateStatus;
  admissionDate: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateAssociateInput = {
  name: string;
  cpf: string;
  category: AssociateCategory;
  registrationNumber: string;
  status: AssociateStatus;
  admissionDate: string;
};

export type UpdateAssociateInput = Partial<CreateAssociateInput>;

export type AssociateFormValues = CreateAssociateInput;

export type AssociateFieldErrors = Partial<Record<keyof AssociateFormValues, string>>;

export type AssociateFilters = {
  search?: string;
  cpf?: string;
  category?: AssociateCategory;
  status?: AssociateStatus;
  registrationNumber?: string;
  admissionDateFrom?: string;
  admissionDateTo?: string;
  page?: number;
  pageSize?: number;
};

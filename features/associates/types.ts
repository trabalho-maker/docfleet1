export type AssociateCategory =
  | "Titular"
  | "Dependente"
  | "Pensionista"
  | "Contribuinte";

export type AssociateStatus = "Ativo" | "Inativo" | "Suspenso" | "Bloqueado";

export type AssociateSex = "M" | "F";

export type AssociateProfileCategory = "TAXI" | "CAMINHAO" | "ESCOLAR" | "CNPJ";

export type AssociateProfileData = {
  modalidadeAssociado: AssociateProfileCategory | null;
  cnpjEmpresa: string | null;
  nomeEmpresa: string | null;
  enderecoCompleto: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  profissao: string | null;
  sexo: AssociateSex | null;
  dataNascimento: string | null;
  nacionalidade: string | null;
  naturalidade: string | null;
  rg: string | null;
  cnh: string | null;
  estadoCivil: string | null;
  nomePai: string | null;
  nomeMae: string | null;
  dependentes: string | null;
  grauParentesco: string | null;
  telefone: string | null;
  celular: string | null;
  email: string | null;
  observacoes: string | null;
  situacaoFinanceira: string | null;
  situacaoDocumental: string | null;
  historicoResumo: string | null;
  fotoUrl: string | null;
};

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
} & AssociateProfileData;

export type CreateAssociateInput = {
  name: string;
  cpf: string;
  category: AssociateCategory;
  registrationNumber: string;
  status: AssociateStatus;
  admissionDate: string;
} & Partial<AssociateProfileData>;

export type UpdateAssociateInput = Partial<CreateAssociateInput>;

export type AssociateFormValues = {
  name: string;
  cpf: string;
  category: AssociateCategory;
  registrationNumber: string;
  status: AssociateStatus;
  admissionDate: string;
  modalidadeAssociado?: AssociateProfileCategory | "";
  cnpjEmpresa?: string;
  nomeEmpresa?: string;
  enderecoCompleto?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  profissao?: string;
  sexo?: AssociateSex | "";
  dataNascimento?: string;
  nacionalidade?: string;
  naturalidade?: string;
  rg?: string;
  cnh?: string;
  estadoCivil?: string;
  nomePai?: string;
  nomeMae?: string;
  dependentes?: string;
  grauParentesco?: string;
  telefone?: string;
  celular?: string;
  email?: string;
  observacoes?: string;
  situacaoFinanceira?: string;
  situacaoDocumental?: string;
  historicoResumo?: string;
  fotoUrl?: string;
};

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

export type AssociateStatusCounts = Record<AssociateStatus, number>;

export type AssociateCategoryCounts = Record<AssociateCategory, number>;

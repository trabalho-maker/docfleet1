import type {
  AssociateOperationRequirementKey,
  AssociateOperationType,
} from "@/features/associates/operations/types";

type AssociateOperationRequirementDefinition = {
  key: AssociateOperationRequirementKey;
  label: string;
  field:
    | "basicDocumentationDueDate"
    | "vehicleAuthorizationDueDate"
    | "driverAuthorizationDueDate"
    | "cargoLicensingDueDate";
};

export type AssociateOperationConfig = {
  type: AssociateOperationType;
  route: string;
  navigationLabel: string;
  eyebrow: string;
  title: string;
  description: string;
  summaryTitle: string;
  summaryDescription: string;
  emptyStateTitle: string;
  emptyStateDescription: string;
  requirements: AssociateOperationRequirementDefinition[];
};

export const associateOperationConfigs: Record<
  AssociateOperationType,
  AssociateOperationConfig
> = {
  Taxista: {
    type: "Taxista",
    route: "/taxistas",
    navigationLabel: "Taxistas",
    eyebrow: "Operacao por categoria",
    title: "TAXISTAS",
    description: "Acompanhe os associados vinculados a operacao de taxi.",
    summaryTitle: "Documentacao essencial",
    summaryDescription: "Itens acompanhados nesta operacao.",
    emptyStateTitle: "Nenhum taxista vinculado ainda",
    emptyStateDescription:
      "Quando houver associados vinculados a operacao de taxi, eles aparecerao aqui com status documentais e operacionais.",
    requirements: [
      {
        key: "basicDocumentation",
        label: "Documentacao basica",
        field: "basicDocumentationDueDate",
      },
    ],
  },
  TransporteEscolar: {
    type: "TransporteEscolar",
    route: "/transportes-escolares",
    navigationLabel: "Transportes escolares",
    eyebrow: "Operacao por categoria",
    title: "Transportes escolares",
    description:
      "Concentre a gestao dos associados vinculados ao transporte escolar com foco em autorizacoes do veiculo e do condutor.",
    summaryTitle: "Autorizacoes da operacao escolar",
    summaryDescription:
      "A base ja esta pronta para separar requisitos do veiculo e do motorista sem duplicar o cadastro principal de associados.",
    emptyStateTitle: "Nenhum transporte escolar vinculado ainda",
    emptyStateDescription:
      "Quando houver associados vinculados ao transporte escolar, esta visao passara a exibir autorizacoes do veiculo e do condutor com status proprio.",
    requirements: [
      {
        key: "vehicleAuthorization",
        label: "Autorizacao do veiculo",
        field: "vehicleAuthorizationDueDate",
      },
      {
        key: "driverAuthorization",
        label: "Autorizacao do condutor",
        field: "driverAuthorizationDueDate",
      },
    ],
  },
  Caminhao: {
    type: "Caminhao",
    route: "/caminhoes",
    navigationLabel: "Caminhoes",
    eyebrow: "Operacao por categoria",
    title: "Caminhoes",
    description:
      "Gerencie associados vinculados a operacao de carga com leitura rapida do licenciamento e dos pontos que exigem acao imediata.",
    summaryTitle: "Regularidade da operacao de carga",
    summaryDescription:
      "A visao por caminhoes separa o contexto operacional da base sindical, preservando o CRUD principal e abrindo espaco para regras especificas.",
    emptyStateTitle: "Nenhum caminhao vinculado ainda",
    emptyStateDescription:
      "Quando houver associados vinculados a operacao de carga, esta pagina passara a destacar licenciamento e prioridade operacional.",
    requirements: [
      {
        key: "cargoLicensing",
        label: "Licenciamento da operacao",
        field: "cargoLicensingDueDate",
      },
    ],
  },
  Empresa: {
    type: "Empresa",
    route: "/empresas",
    navigationLabel: "Empresas",
    eyebrow: "Operacao por categoria",
    title: "Empresas",
    description:
      "Consolide os associados com perfil empresarial para acompanhar CNPJs cadastrados, documentacao da empresa e leitura operacional em uma visao dedicada.",
    summaryTitle: "Documentacao empresarial",
    summaryDescription:
      "Esta visao reune todos os cadastros com modalidade CNPJ e preserva o mesmo nucleo de associados, sem duplicar o CRUD nem misturar dados da ficha com outras operacoes.",
    emptyStateTitle: "Nenhuma empresa vinculada ainda",
    emptyStateDescription:
      "Quando houver associados com modalidade CNPJ, esta pagina passara a exibir a documentacao empresarial e o status operacional correspondente.",
    requirements: [
      {
        key: "companyDocumentation",
        label: "Documentacao empresarial",
        field: "basicDocumentationDueDate",
      },
    ],
  },
};

export function getAssociateOperationConfig(type: AssociateOperationType) {
  return associateOperationConfigs[type];
}

export function listAssociateOperationConfigs() {
  return Object.values(associateOperationConfigs);
}

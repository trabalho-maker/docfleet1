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
    eyebrow: "Operação por categoria",
    title: "Taxistas",
    description:
      "Acompanhe associados vinculados à operação de táxi com foco em documentação básica, regularidade e prontidão operacional.",
    summaryTitle: "Documentação essencial do taxista",
    summaryDescription:
      "Nesta visão, o DocFleet destaca o vencimento dos requisitos centrais para manter o associado apto à operação diária.",
    emptyStateTitle: "Nenhum taxista vinculado ainda",
    emptyStateDescription:
      "Assim que houver associados vinculados à operação de táxi, esta página passará a destacar documentação básica e status operacional.",
    requirements: [
      {
        key: "basicDocumentation",
        label: "Documentação básica",
        field: "basicDocumentationDueDate",
      },
    ],
  },
  TransporteEscolar: {
    type: "TransporteEscolar",
    route: "/transportes-escolares",
    navigationLabel: "Transportes escolares",
    eyebrow: "Operação por categoria",
    title: "Transportes escolares",
    description:
      "Concentre a gestão dos associados vinculados ao transporte escolar com foco em autorizações do veículo e do condutor.",
    summaryTitle: "Autorizações da operação escolar",
    summaryDescription:
      "A base já está pronta para separar requisitos do veículo e do motorista sem duplicar o cadastro principal de associados.",
    emptyStateTitle: "Nenhum transporte escolar vinculado ainda",
    emptyStateDescription:
      "Quando houver associados vinculados ao transporte escolar, esta visão passará a exibir autorizações do veículo e do condutor com status próprio.",
    requirements: [
      {
        key: "vehicleAuthorization",
        label: "Autorização do veículo",
        field: "vehicleAuthorizationDueDate",
      },
      {
        key: "driverAuthorization",
        label: "Autorização do condutor",
        field: "driverAuthorizationDueDate",
      },
    ],
  },
  Caminhao: {
    type: "Caminhao",
    route: "/caminhoes",
    navigationLabel: "Caminhões",
    eyebrow: "Operação por categoria",
    title: "Caminhões",
    description:
      "Gerencie associados vinculados à operação de carga com leitura rápida do licenciamento e dos pontos que exigem ação imediata.",
    summaryTitle: "Regularidade da operação de carga",
    summaryDescription:
      "A visão por caminhões separa o contexto operacional da base sindical, preservando o CRUD principal e abrindo espaço para regras específicas.",
    emptyStateTitle: "Nenhum caminhão vinculado ainda",
    emptyStateDescription:
      "Quando houver associados vinculados à operação de carga, esta página passará a destacar licenciamento e prioridade operacional.",
    requirements: [
      {
        key: "cargoLicensing",
        label: "Licenciamento da operação",
        field: "cargoLicensingDueDate",
      },
    ],
  },
  Empresa: {
    type: "Empresa",
    route: "/empresas",
    navigationLabel: "Empresas",
    eyebrow: "Operação por categoria",
    title: "Empresas",
    description:
      "Consolide os associados com perfil empresarial para acompanhar CNPJs cadastrados, documentação da empresa e leitura operacional em uma visão dedicada.",
    summaryTitle: "Documentação empresarial",
    summaryDescription:
      "Esta visão reúne todos os cadastros com modalidade CNPJ e preserva o mesmo núcleo de associados, sem duplicar o CRUD nem misturar dados da ficha com outras operações.",
    emptyStateTitle: "Nenhuma empresa vinculada ainda",
    emptyStateDescription:
      "Quando houver associados com modalidade CNPJ, esta página passará a exibir a documentação empresarial e o status operacional correspondente.",
    requirements: [
      {
        key: "companyDocumentation",
        label: "Documentação empresarial",
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

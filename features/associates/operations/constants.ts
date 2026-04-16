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
    requirements: [
      {
        key: "cargoLicensing",
        label: "Licenciamento da operação",
        field: "cargoLicensingDueDate",
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

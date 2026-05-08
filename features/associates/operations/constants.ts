import type {
  AssociateOperationRequirementKey,
  AssociateOperationType,
} from "@/features/associates/operations/types";
import type { DocumentType } from "@/features/documents/constants";

type AssociateOperationRequirementDefinition = {
  key: AssociateOperationRequirementKey;
  label: string;
  field:
    | "basicDocumentationDueDate"
    | "vehicleAuthorizationDueDate"
    | "driverAuthorizationDueDate"
    | "cargoLicensingDueDate";
  documentType?: DocumentType;
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
    title: "TAXISTAS",
    description: "Acompanhe os associados vinculados à operação de táxi.",
    summaryTitle: "Exigência operacional",
    summaryDescription: "Leitura do vencimento principal por taxista.",
    emptyStateTitle: "Nenhum taxista vinculado ainda",
    emptyStateDescription:
      "Associados com modalidade TAXI aparecerão aqui.",
    requirements: [
      {
        key: "basicDocumentation",
        label: "Documentação básica",
        field: "basicDocumentationDueDate",
        documentType: "CNH",
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
      "Acompanhe os associados do transporte escolar.",
    summaryTitle: "Autorizações",
    summaryDescription: "Leitura das autorizações do veículo e do condutor.",
    emptyStateTitle: "Nenhum transporte escolar vinculado ainda",
    emptyStateDescription:
      "Associados do transporte escolar aparecerão aqui.",
    requirements: [
      {
        key: "vehicleAuthorization",
        label: "Autorização do veículo",
        field: "vehicleAuthorizationDueDate",
        documentType: "AUTORIZACAO_VEICULO",
      },
      {
        key: "driverAuthorization",
        label: "Autorização do condutor",
        field: "driverAuthorizationDueDate",
        documentType: "AUTORIZACAO_CONDUTOR",
      },
    ],
  },
  Caminhao: {
    type: "Caminhao",
    route: "/caminhoes",
    navigationLabel: "Caminhoes",
    eyebrow: "Operação por categoria",
    title: "Caminhões",
    description:
      "Acompanhe os associados vinculados à operação de carga.",
    summaryTitle: "Licenciamento",
    summaryDescription: "Leitura rápida do licenciamento da operação.",
    emptyStateTitle: "Nenhum caminhão vinculado ainda",
    emptyStateDescription:
      "Associados da operação de carga aparecerão aqui.",
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
      "Acompanhe os associados com perfil empresarial.",
    summaryTitle: "Documentação empresarial",
    summaryDescription: "Leitura documental dos cadastros com modalidade CNPJ.",
    emptyStateTitle: "Nenhuma empresa vinculada ainda",
    emptyStateDescription:
      "Associados com modalidade CNPJ aparecerão aqui.",
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

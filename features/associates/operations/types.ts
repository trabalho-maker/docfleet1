import type { Associate } from "@/features/associates/types";
import type { DocumentStatus } from "@/features/data/types";

export type AssociateOperationType =
  | "Taxista"
  | "TransporteEscolar"
  | "Caminhao"
  | "Empresa";

export type AssociateOperationRequirementKey =
  | "basicDocumentation"
  | "vehicleAuthorization"
  | "driverAuthorization"
  | "cargoLicensing"
  | "companyDocumentation";

export type AssociateOperationRequirementStatus = DocumentStatus | "Missing";

export type AssociateOperationProfile = {
  associateId: string;
  operationType: AssociateOperationType;
  basicDocumentationDueDate: string | null;
  vehicleAuthorizationDueDate: string | null;
  driverAuthorizationDueDate: string | null;
  cargoLicensingDueDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AssociateOperationRequirement = {
  key: AssociateOperationRequirementKey;
  label: string;
  dueDate: string | null;
  status: AssociateOperationRequirementStatus;
};

export type AssociateOperationAssociate = {
  id: Associate["id"];
  name: Associate["name"];
  category: Associate["category"];
  registrationNumber: Associate["registrationNumber"];
  status: Associate["status"];
};

export type AssociateOperationEntry = {
  associate: AssociateOperationAssociate;
  profile: AssociateOperationProfile;
  requirements: AssociateOperationRequirement[];
  overallStatus: AssociateOperationRequirementStatus;
};

export type AssociateOperationMetrics = {
  totalAssociates: number;
  valid: number;
  attention: number;
  critical: number;
};

export type AssociateOperationOverview = {
  operationType: AssociateOperationType;
  entries: AssociateOperationEntry[];
  metrics: AssociateOperationMetrics;
};

export function createEmptyAssociateOperationOverview(
  operationType: AssociateOperationType,
): AssociateOperationOverview {
  return {
    operationType,
    entries: [],
    metrics: {
      totalAssociates: 0,
      valid: 0,
      attention: 0,
      critical: 0,
    },
  };
}

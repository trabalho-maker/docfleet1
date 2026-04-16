import type { Associate } from "@/features/associates/types";
import type { DocumentStatus } from "@/features/data/types";

export type AssociateOperationType =
  | "Taxista"
  | "TransporteEscolar"
  | "Caminhao";

export type AssociateOperationRequirementKey =
  | "basicDocumentation"
  | "vehicleAuthorization"
  | "driverAuthorization"
  | "cargoLicensing";

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

export type AssociateOperationEntry = {
  associate: Associate;
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

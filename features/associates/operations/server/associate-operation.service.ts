import { calculateDocumentStatus } from "@/features/documents/lib/expiration";
import {
  getAssociateOperationConfig,
  type AssociateOperationConfig,
} from "@/features/associates/operations/constants";
import {
  SqliteAssociateOperationRepository,
  type AssociateOperationRepository,
} from "@/features/associates/operations/server/associate-operation.repository";
import type {
  AssociateOperationAssociate,
  AssociateOperationEntry,
  AssociateOperationOverview,
  AssociateOperationRequirement,
  AssociateOperationRequirementStatus,
  AssociateOperationType,
} from "@/features/associates/operations/types";
import { createEmptyAssociateOperationOverview } from "@/features/associates/operations/types";

type AssociateOperationServiceOptions = {
  repository?: AssociateOperationRepository;
};

export function createAssociateOperationService(
  options: AssociateOperationServiceOptions = {},
) {
  const repository =
    options.repository ?? new SqliteAssociateOperationRepository();

  return {
    async getOperationOverview(
      operationType: AssociateOperationType,
    ): Promise<AssociateOperationOverview> {
      const config = getAssociateOperationConfig(operationType);
      const records = await repository.findByOperationType(operationType);
      return records.reduce<AssociateOperationOverview>(
        (overview, record) => {
          const entry = buildAssociateOperationEntry(
            record.associate,
            record.profile,
            config,
          );

          overview.entries.push(entry);
          overview.metrics.totalAssociates += 1;

          if (entry.overallStatus === "Valido") {
            overview.metrics.valid += 1;
          } else if (entry.overallStatus === "Atencao") {
            overview.metrics.attention += 1;
          } else {
            overview.metrics.critical += 1;
          }

          return overview;
        },
        createEmptyAssociateOperationOverview(operationType),
      );
    },
  };
}

function buildAssociateOperationEntry(
  associate: AssociateOperationAssociate,
  profile: AssociateOperationEntry["profile"],
  config: AssociateOperationConfig,
): AssociateOperationEntry {
  const requirements = config.requirements.map<AssociateOperationRequirement>(
    (requirementDefinition) => {
      const dueDate = profile[requirementDefinition.field];

      return {
        key: requirementDefinition.key,
        label: requirementDefinition.label,
        dueDate,
        status: dueDate ? calculateDocumentStatus(dueDate) : "Missing",
      };
    },
  );

  return {
    associate,
    profile,
    requirements,
    overallStatus: getOverallStatus(requirements),
  };
}

function getOverallStatus(
  requirements: AssociateOperationRequirement[],
): AssociateOperationRequirementStatus {
  if (requirements.some((requirement) => requirement.status === "Missing")) {
    return "Missing";
  }

  if (requirements.some((requirement) => requirement.status === "Vencido")) {
    return "Vencido";
  }

  if (requirements.some((requirement) => requirement.status === "Atencao")) {
    return "Atencao";
  }

  return "Valido";
}

export type AssociateOperationService = ReturnType<
  typeof createAssociateOperationService
>;

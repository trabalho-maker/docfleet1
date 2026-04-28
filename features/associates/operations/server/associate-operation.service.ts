import {
  getAssociateOperationConfig,
  type AssociateOperationConfig,
} from "@/features/associates/operations/constants";
import {
  type AssociateOperationRecord,
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
import {
  SqliteDocumentRepository,
  type DocumentRepository,
} from "@/features/data/repositories/document-repository";
import { resolveDocumentRequirement } from "@/features/documents/lib/document-status-source";
import type { FleetDocument } from "@/features/data/types";
import type { DocumentType } from "@/features/documents/constants";

type AssociateOperationServiceOptions = {
  repository?: AssociateOperationRepository;
  documentRepository?: Pick<DocumentRepository, "listByAssociateIds">;
};

export function createAssociateOperationService(
  options: AssociateOperationServiceOptions = {},
) {
  const repository =
    options.repository ?? new SqliteAssociateOperationRepository();
  const documentRepository =
    options.documentRepository ?? new SqliteDocumentRepository();

  return {
    async getOperationOverview(
      operationType: AssociateOperationType,
    ): Promise<AssociateOperationOverview> {
      const config = getAssociateOperationConfig(operationType);
      const records = await repository.findByOperationType(operationType);
      const documentsByAssociateId = await loadOperationDocumentsByAssociateId(
        records,
        config,
        documentRepository,
      );
      return records.reduce<AssociateOperationOverview>(
        (overview, record) => {
          const entry = buildAssociateOperationEntry(
            record.associate,
            record.profile,
            config,
            documentsByAssociateId.get(record.associate.id) ?? [],
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
  documents: FleetDocument[],
): AssociateOperationEntry {
  const requirements = config.requirements.map<AssociateOperationRequirement>(
    (requirementDefinition) => {
      const resolvedRequirement = resolveDocumentRequirement(documents, {
        documentType: requirementDefinition.documentType,
        fallbackDueDate: profile[requirementDefinition.field],
      });

      return {
        key: requirementDefinition.key,
        label: requirementDefinition.label,
        dueDate: resolvedRequirement.dueDate,
        status: resolvedRequirement.status,
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

async function loadOperationDocumentsByAssociateId(
  records: AssociateOperationRecord[],
  config: AssociateOperationConfig,
  documentRepository: Pick<DocumentRepository, "listByAssociateIds">,
) {
  const associateIds = new Set(records.map((record) => record.associate.id));
  const documentTypes = Array.from(
    new Set(
      config.requirements
        .map((requirement) => requirement.documentType)
        .filter((documentType): documentType is DocumentType => Boolean(documentType)),
    ),
  );

  if (associateIds.size === 0 || documentTypes.length === 0) {
    return new Map<string, FleetDocument[]>();
  }

  const documents = await documentRepository.listByAssociateIds(
    Array.from(associateIds),
    {
      documentTypes,
    },
  );
  const documentsByAssociateId = new Map<string, FleetDocument[]>();

  for (const document of documents) {
    if (!document.associateId || !associateIds.has(document.associateId)) {
      continue;
    }

    const existingDocuments = documentsByAssociateId.get(document.associateId) ?? [];
    existingDocuments.push(document);
    documentsByAssociateId.set(document.associateId, existingDocuments);
  }

  return documentsByAssociateId;
}

export type AssociateOperationService = ReturnType<
  typeof createAssociateOperationService
>;

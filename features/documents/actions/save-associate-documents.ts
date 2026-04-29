"use server";

import {
  AssociateAccessDeniedError,
  requireAssociateModuleAccess,
} from "@/features/associates/server/access";
import { SqliteAssociateRepository } from "@/features/associates/server/associate.repository";
import {
  associateDocumentTypes,
  getDocumentTypeLabel,
} from "@/features/documents/constants";
import { parseDocumentDueDate } from "@/features/documents/lib/expiration";
import { syncAssociateDocumentsWithAlerts } from "@/features/documents/server/document-service";
import type {
  AssociateDocumentFieldErrors,
  AssociateDocumentFormValues,
} from "@/features/documents/types";
import { logger } from "@/lib/logger";

export type SaveAssociateDocumentsActionResult =
  | { success: true }
  | {
      success: false;
      fieldErrors?: AssociateDocumentFieldErrors;
      formError?: string;
      notFound?: boolean;
    };

export async function saveAssociateDocumentsAction(
  associateId: string,
  values: AssociateDocumentFormValues,
): Promise<SaveAssociateDocumentsActionResult> {
  let user;

  try {
    user = await requireAssociateModuleAccess("edit");
  } catch (error) {
    if (error instanceof AssociateAccessDeniedError) {
      return {
        success: false,
        formError: error.message,
      };
    }

    throw error;
  }

  const normalizedAssociateId = associateId.trim();

  if (!normalizedAssociateId) {
    return {
      success: false,
      notFound: true,
      formError: "Associado não encontrado.",
    };
  }

  const associateRepository = new SqliteAssociateRepository();
  const associate = await associateRepository.findById(normalizedAssociateId);

  if (!associate) {
    return {
      success: false,
      notFound: true,
      formError: "Associado não encontrado.",
    };
  }

  const fieldErrors: AssociateDocumentFieldErrors = {};

  for (const documentType of associateDocumentTypes) {
    const dueDate = values[documentType].trim();

    if (!dueDate) {
      continue;
    }

    if (!parseDocumentDueDate(dueDate)) {
      fieldErrors[documentType] = `Informe um vencimento válido para ${getDocumentTypeLabel(documentType)}.`;
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      fieldErrors,
    };
  }

  await syncAssociateDocumentsWithAlerts({
    associateId: normalizedAssociateId,
    owner: user.name ?? user.email ?? "Usuário DocFleet",
    documents: associateDocumentTypes.map((documentType) => ({
      documentType,
      dueDate: values[documentType].trim(),
      notes: null,
    })),
  });

  logger.info("associates.documents.sync.success", {
    userId: user.id,
    associateId: normalizedAssociateId,
  });

  return {
    success: true,
  };
}

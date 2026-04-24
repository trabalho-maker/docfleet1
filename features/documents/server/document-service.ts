import { createDataLayer } from "@/features/data/repositories";
import type { CreateDocumentInput, UpdateDocumentInput } from "@/features/data/types";
import type { DocumentType } from "@/features/documents/constants";
import {
  removeDocumentExpirationAlertsForDocument,
  syncDocumentExpirationAlertForDocument,
} from "@/features/alerts/server/document-expiration-alert-service";
import { getDatabaseAdapter } from "@/lib/database/provider";
import { createSessionDatabaseAdapter } from "@/lib/database/session-adapter";

export type AssociateStructuredDocumentInput = {
  documentType: DocumentType;
  dueDate: string;
  notes?: string | null;
};

export async function createDocumentWithAlerts(input: CreateDocumentInput) {
  const databaseAdapter = getDatabaseAdapter();

  return databaseAdapter.write(async (session) => {
    const scopedAdapter = createSessionDatabaseAdapter(databaseAdapter.provider, session);
    const dataLayer = createDataLayer({ adapter: scopedAdapter });
    const document = await dataLayer.documents.create(input);

    await syncDocumentExpirationAlertForDocument(document, {
      dataLayer,
    });

    return document;
  });
}

export async function updateDocumentWithAlerts(
  documentId: string,
  input: UpdateDocumentInput,
) {
  const databaseAdapter = getDatabaseAdapter();

  return databaseAdapter.write(async (session) => {
    const scopedAdapter = createSessionDatabaseAdapter(databaseAdapter.provider, session);
    const dataLayer = createDataLayer({ adapter: scopedAdapter });
    const document = await dataLayer.documents.update(documentId, input);

    await syncDocumentExpirationAlertForDocument(document, {
      dataLayer,
    });

    return document;
  });
}

export async function deleteDocumentWithAlerts(documentId: string) {
  const databaseAdapter = getDatabaseAdapter();

  return databaseAdapter.write(async (session) => {
    const scopedAdapter = createSessionDatabaseAdapter(databaseAdapter.provider, session);
    const dataLayer = createDataLayer({ adapter: scopedAdapter });

    await dataLayer.documents.delete(documentId);
    await removeDocumentExpirationAlertsForDocument(documentId, {
      dataLayer,
    });
  });
}

export async function syncAssociateDocumentsWithAlerts(input: {
  associateId: string;
  owner: string;
  documents: AssociateStructuredDocumentInput[];
}) {
  const databaseAdapter = getDatabaseAdapter();

  return databaseAdapter.write(async (session) => {
    const scopedAdapter = createSessionDatabaseAdapter(databaseAdapter.provider, session);
    const dataLayer = createDataLayer({ adapter: scopedAdapter });

    for (const documentInput of input.documents) {
      if (!documentInput.dueDate) {
        const existing = await dataLayer.documents.findByAssociateAndType(
          input.associateId,
          documentInput.documentType,
        );

        if (existing) {
          await dataLayer.documents.delete(existing.id);
          await removeDocumentExpirationAlertsForDocument(existing.id, {
            dataLayer,
          });
        }

        continue;
      }

      const savedDocument = await dataLayer.documents.create({
        associateId: input.associateId,
        documentType: documentInput.documentType,
        dueDate: documentInput.dueDate,
        owner: input.owner,
        notes: documentInput.notes ?? null,
      });

      await syncDocumentExpirationAlertForDocument(savedDocument, {
        dataLayer,
      });
    }

    return dataLayer.documents.findByAssociateId(input.associateId);
  });
}

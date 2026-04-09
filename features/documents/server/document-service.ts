import { createDataLayer } from "@/features/data/repositories";
import type { CreateDocumentInput, UpdateDocumentInput } from "@/features/data/types";
import {
  removeDocumentExpirationAlertsForDocument,
  syncDocumentExpirationAlertForDocument,
} from "@/features/alerts/server/document-expiration-alert-service";
import { getDatabaseAdapter } from "@/lib/database/provider";
import { createSessionDatabaseAdapter } from "@/lib/database/session-adapter";

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

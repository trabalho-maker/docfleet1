import { createDataLayer } from "@/features/data/repositories";
import {
  createDocumentWithAlerts,
  syncAssociateDocumentsWithAlerts,
} from "@/features/documents/server/document-service";
import {
  resetSqliteDatabase,
  resetSqliteStorageState,
} from "@/lib/storage/sqlite-storage";

describe("document service", () => {
  beforeEach(async () => {
    await resetSqliteStorageState();
    await resetSqliteDatabase();
  });

  afterAll(async () => {
    await resetSqliteStorageState();
  });

  it("creates and updates structured documents from the associate complementary page", async () => {
    const firstSync = await syncAssociateDocumentsWithAlerts({
      associateId: "asc_01",
      owner: "Equipe Operacional",
      documents: [
        {
          documentType: "CNH",
          dueDate: "2099-05-10",
        },
        {
          documentType: "TOXICOLOGICO",
          dueDate: "2099-06-11",
        },
      ],
    });

    expect(firstSync).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          associateId: "asc_01",
          documentType: "CNH",
        }),
        expect.objectContaining({
          associateId: "asc_01",
          documentType: "TOXICOLOGICO",
        }),
      ]),
    );

    const secondSync = await syncAssociateDocumentsWithAlerts({
      associateId: "asc_01",
      owner: "Equipe Operacional",
      documents: [
        {
          documentType: "CNH",
          dueDate: "2099-07-20",
        },
        {
          documentType: "TOXICOLOGICO",
          dueDate: "",
        },
      ],
    });

    expect(
      secondSync.find((document) => document.documentType === "CNH")?.dueDate,
    ).toBe("2099-07-20");
    expect(
      secondSync.some((document) => document.documentType === "TOXICOLOGICO"),
    ).toBe(false);

    const dataLayer = createDataLayer();
    const cnhDocument = await dataLayer.documents.findByAssociateAndType("asc_01", "CNH");
    const cnhDocuments = await dataLayer.documents.findByAssociateId("asc_01", {
      documentTypes: ["CNH"],
    });
    const toxDocument = await dataLayer.documents.findByAssociateAndType(
      "asc_01",
      "TOXICOLOGICO",
    );

    expect(cnhDocument?.associateId).toBe("asc_01");
    expect(cnhDocuments).toHaveLength(1);
    expect(toxDocument).toBeNull();
  });

  it("keeps structured documents and generated alerts after the storage layer is restarted", async () => {
    const createdDocument = await createDocumentWithAlerts({
      associateId: "asc_01",
      documentType: "TACOGRAFO",
      dueDate: "2000-01-03",
      owner: "Equipe Operacional",
      notes: "Documento persistido em disco.",
    });

    await resetSqliteStorageState();

    const reloadedDataLayer = createDataLayer();
    const persistedDocument = await reloadedDataLayer.documents.findById(createdDocument.id);
    const persistedAlert = await reloadedDataLayer.alerts.findGeneratedBySourceDocumentId(
      createdDocument.id,
    );

    expect(persistedDocument).toMatchObject({
      id: createdDocument.id,
      associateId: "asc_01",
      documentType: "TACOGRAFO",
      notes: "Documento persistido em disco.",
    });
    expect(persistedAlert).toMatchObject({
      sourceDocumentId: createdDocument.id,
      kind: "document_expiration",
    });
  });
});

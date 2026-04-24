import { createDataLayer } from "@/features/data/repositories";
import { syncAssociateDocumentsWithAlerts } from "@/features/documents/server/document-service";
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
});

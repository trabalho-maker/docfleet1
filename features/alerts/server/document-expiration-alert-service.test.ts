import { createDataLayer } from "@/features/data/repositories";
import {
  reconcileDocumentExpirationAlerts,
  removeDocumentExpirationAlertsForDocument,
  syncDocumentExpirationAlertForDocument,
} from "@/features/alerts/server/document-expiration-alert-service";
import {
  resetSqliteDatabase,
  resetSqliteStorageState,
} from "@/lib/storage/sqlite-storage";

describe("document expiration alert service", () => {
  beforeEach(async () => {
    await resetSqliteStorageState();
    await resetSqliteDatabase();
  });

  afterAll(async () => {
    await resetSqliteStorageState();
  });

  it("reconciles only documents within the attention window and generates alerts for them", async () => {
    const result = await reconcileDocumentExpirationAlerts();

    expect(result.scannedDocuments).toBe(2);
    expect(result.createdAlerts).toBe(2);
    expect(result.updatedAlerts).toBe(0);
    expect(result.deletedAlerts).toBe(0);

    const dataLayer = createDataLayer();
    const storedAlerts = await dataLayer.alerts.listOpen(10);

    expect(
      storedAlerts.some(
        (alert) =>
          alert.kind === "document_expiration" &&
          alert.sourceDocumentId === "doc_01",
      ),
    ).toBe(true);
  });

  it("updates only the changed document alert instead of recalculating the full set", async () => {
    const dataLayer = createDataLayer();
    await reconcileDocumentExpirationAlerts();
    const updatedDocument = await dataLayer.documents.update("doc_01", {
      name: "Licenciamento da frota leve",
      type: "Veiculos",
      dueDate: "2099-12-31",
    });

    const result = await syncDocumentExpirationAlertForDocument(updatedDocument);

    expect(result).toEqual({
      documentId: "doc_01",
      action: "deleted",
    });

    const storedAlerts = await dataLayer.alerts.listOpen(10);
    const generatedAlerts = storedAlerts.filter(
      (alert) => alert.kind === "document_expiration",
    );

    expect(generatedAlerts).toHaveLength(1);
    expect(
      generatedAlerts.every((alert) => alert.sourceDocumentId !== "doc_01"),
    ).toBe(true);
  });

  it("removes generated alerts when a document is deleted", async () => {
    const dataLayer = createDataLayer();
    await reconcileDocumentExpirationAlerts();

    await removeDocumentExpirationAlertsForDocument("doc_03");

    const remainingGeneratedAlerts = (await dataLayer.alerts.listOpen(10)).filter(
      (alert) => alert.kind === "document_expiration",
    );

    expect(remainingGeneratedAlerts).toHaveLength(1);
    expect(
      remainingGeneratedAlerts.every((alert) => alert.sourceDocumentId !== "doc_03"),
    ).toBe(true);
  });

  it("preserves manual alerts while reconciling only generated expiration alerts", async () => {
    const dataLayer = createDataLayer();
    const beforeSync = await dataLayer.alerts.listOpen(10);
    const manualAlertsBefore = beforeSync.filter(
      (alert) => alert.kind !== "document_expiration",
    );

    expect(manualAlertsBefore).toHaveLength(3);

    const result = await reconcileDocumentExpirationAlerts();

    const afterSync = await dataLayer.alerts.listOpen(10);
    const manualAlertsAfter = afterSync.filter(
      (alert) => alert.kind !== "document_expiration",
    );
    const generatedAlertsAfter = afterSync.filter(
      (alert) => alert.kind === "document_expiration",
    );

    expect(manualAlertsAfter).toHaveLength(3);
    expect(generatedAlertsAfter.length).toBeGreaterThan(0);
    expect(result.createdAlerts).toBeGreaterThan(0);
    expect(
      manualAlertsAfter.map((alert) => alert.id).sort(),
    ).toEqual(manualAlertsBefore.map((alert) => alert.id).sort());
  });
});

import { createDataLayer } from "@/features/data/repositories";
import { syncDocumentExpirationAlerts } from "@/features/alerts/server/document-expiration-alert-service";
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

  it("generates alerts for documents approaching expiration", async () => {
    const alerts = await syncDocumentExpirationAlerts();

    expect(alerts).toHaveLength(2);
    expect(alerts.map((alert) => alert.sourceDocumentId)).toEqual(
      expect.arrayContaining(["doc_01", "doc_03"]),
    );

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

  it("removes generated alerts when documents no longer require attention", async () => {
    const dataLayer = createDataLayer();
    await syncDocumentExpirationAlerts();

    await dataLayer.documents.update("doc_01", {
      name: "Licenciamento da frota leve",
      type: "Veiculos",
      dueDate: "2099-12-31",
    });
    await dataLayer.documents.update("doc_03", {
      name: "ASO dos motoristas",
      type: "Pessoas",
      dueDate: "2099-12-31",
    });

    const alerts = await syncDocumentExpirationAlerts();

    expect(alerts).toHaveLength(0);

    const storedAlerts = await dataLayer.alerts.listOpen(10);
    const generatedAlerts = storedAlerts.filter(
      (alert) => alert.kind === "document_expiration",
    );

    expect(generatedAlerts).toHaveLength(0);
  });

  it("preserves manual alerts while replacing only generated expiration alerts", async () => {
    const dataLayer = createDataLayer();
    const beforeSync = await dataLayer.alerts.listOpen(10);
    const manualAlertsBefore = beforeSync.filter(
      (alert) => alert.kind !== "document_expiration",
    );

    expect(manualAlertsBefore).toHaveLength(3);

    await syncDocumentExpirationAlerts();

    const afterSync = await dataLayer.alerts.listOpen(10);
    const manualAlertsAfter = afterSync.filter(
      (alert) => alert.kind !== "document_expiration",
    );
    const generatedAlertsAfter = afterSync.filter(
      (alert) => alert.kind === "document_expiration",
    );

    expect(manualAlertsAfter).toHaveLength(3);
    expect(generatedAlertsAfter.length).toBeGreaterThan(0);
    expect(
      manualAlertsAfter.map((alert) => alert.id).sort(),
    ).toEqual(manualAlertsBefore.map((alert) => alert.id).sort());
  });
});

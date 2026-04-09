jest.mock("@/features/auth/server/session", () => ({
  getCurrentUser: jest.fn(),
}));

import { getCurrentUser } from "@/features/auth/server/session";
import { createDataLayer } from "@/features/data/repositories";
import { getDashboardOverview } from "@/features/dashboard/server/get-dashboard-overview";
import {
  resetSqliteDatabase,
  resetSqliteStorageState,
} from "@/lib/storage/sqlite-storage";

const mockedGetCurrentUser = jest.mocked(getCurrentUser);

describe("dashboard alerts integration", () => {
  beforeEach(async () => {
    await resetSqliteStorageState();
    await resetSqliteDatabase();
    mockedGetCurrentUser.mockReset();
    mockedGetCurrentUser.mockResolvedValue({
      id: "usr_operacoes",
      name: "Operacoes DocFleet",
      email: "operacoes@docfleet.local",
      role: "Gestor de frota",
    });
  });

  afterAll(async () => {
    await resetSqliteStorageState();
  });

  it("reconciles generated alerts and exposes them through the dashboard overview", async () => {
    const dataLayer = createDataLayer();
    const createdDocument = await dataLayer.documents.create({
      name: "Laudo da frota critica",
      type: "Seguranca",
      dueDate: "2000-01-03",
      owner: "Seguranca Operacional",
    });

    const overview = await getDashboardOverview();
    const generatedAlert = overview.alerts.find(
      (alert) => alert.sourceDocumentId === createdDocument.id,
    );

    expect(overview.user.email).toBe("operacoes@docfleet.local");
    expect(overview.recentDocuments.some((item) => item.id === createdDocument.id)).toBe(
      true,
    );
    expect(generatedAlert).toBeDefined();
    expect(generatedAlert?.title).toContain("Laudo da frota critica");
    expect(overview.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Alertas abertos",
        }),
      ]),
    );
  });
});

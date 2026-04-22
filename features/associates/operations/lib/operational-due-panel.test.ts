import { buildOperationalDuePanel } from "@/features/associates/operations/lib/operational-due-panel";
import type { AssociateOperationEntry } from "@/features/associates/operations/types";

describe("operational due panel", () => {
  it("counts only upcoming operational requirements inside the monitoring window", () => {
    const entries: AssociateOperationEntry[] = [
      {
        associate: {
          id: "asc_01",
          name: "Maria de Souza",
          category: "Titular",
          registrationNumber: "MAT-2026-0001",
          status: "Ativo",
        },
        profile: {
          associateId: "asc_01",
          operationType: "Taxista",
          basicDocumentationDueDate: "2026-05-10",
          vehicleAuthorizationDueDate: "2026-07-25",
          driverAuthorizationDueDate: null,
          cargoLicensingDueDate: null,
          createdAt: "2026-04-01T10:00:00.000Z",
          updatedAt: "2026-04-01T10:00:00.000Z",
        },
        overallStatus: "Atencao",
        requirements: [
          {
            key: "basicDocumentation",
            label: "Documentacao basica",
            dueDate: "2026-05-10",
            status: "Atencao",
          },
          {
            key: "vehicleAuthorization",
            label: "Autorizacao do veiculo",
            dueDate: "2026-07-25",
            status: "Valido",
          },
        ],
      },
      {
        associate: {
          id: "asc_02",
          name: "Carlos Lima",
          category: "Titular",
          registrationNumber: "MAT-2026-0002",
          status: "Ativo",
        },
        profile: {
          associateId: "asc_02",
          operationType: "Taxista",
          basicDocumentationDueDate: "2026-06-02",
          vehicleAuthorizationDueDate: null,
          driverAuthorizationDueDate: "2026-04-20",
          cargoLicensingDueDate: null,
          createdAt: "2026-04-01T10:00:00.000Z",
          updatedAt: "2026-04-01T10:00:00.000Z",
        },
        overallStatus: "Valido",
        requirements: [
          {
            key: "basicDocumentation",
            label: "Documentacao basica",
            dueDate: "2026-06-02",
            status: "Valido",
          },
          {
            key: "driverAuthorization",
            label: "Autorizacao do condutor",
            dueDate: "2026-04-20",
            status: "Vencido",
          },
        ],
      },
    ];

    const panel = buildOperationalDuePanel(entries, {
      now: new Date("2026-04-22T00:00:00Z"),
      windowDays: 60,
    });

    expect(panel.totalUpcoming).toBe(2);
    expect(panel.monthBuckets).toHaveLength(2);
    expect(panel.monthBuckets[0]).toMatchObject({ key: "2026-05", count: 1 });
    expect(panel.monthBuckets[1]).toMatchObject({ key: "2026-06", count: 1 });
    expect(panel.monthBuckets[0].label.toLowerCase()).toContain("mai");
    expect(panel.monthBuckets[1].label.toLowerCase()).toContain("jun");
    expect(panel.requirementBuckets).toEqual([
      { label: "Documentacao basica", count: 2 },
    ]);
  });
});

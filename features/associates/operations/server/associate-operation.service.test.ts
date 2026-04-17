import { createAssociateOperationService } from "@/features/associates/operations/server/associate-operation.service";
import type { AssociateOperationRepository } from "@/features/associates/operations/server/associate-operation.repository";

describe("associate operation service", () => {
  it("builds category-specific requirements and aggregates metrics in one overview", async () => {
    const repository: AssociateOperationRepository = {
      async findByOperationType() {
        return [
          {
            associate: {
              id: "asc_school_01",
              name: "Escola Modelo",
              category: "Titular",
              registrationNumber: "MAT-2026-0101",
              status: "Ativo",
            },
            profile: {
              associateId: "asc_school_01",
              operationType: "TransporteEscolar",
              basicDocumentationDueDate: null,
              vehicleAuthorizationDueDate: "2099-01-01",
              driverAuthorizationDueDate: "2000-01-01",
              cargoLicensingDueDate: null,
              createdAt: "2026-04-01T10:00:00.000Z",
              updatedAt: "2026-04-01T10:00:00.000Z",
            },
          },
        ];
      },
    };

    const service = createAssociateOperationService({ repository });
    const overview = await service.getOperationOverview("TransporteEscolar");

    expect(overview.operationType).toBe("TransporteEscolar");
    expect(overview.metrics).toEqual({
      totalAssociates: 1,
      valid: 0,
      attention: 0,
      critical: 1,
    });
    expect(overview.entries).toHaveLength(1);
    expect(overview.entries[0].requirements).toEqual([
      {
        key: "vehicleAuthorization",
        label: "Autorização do veículo",
        dueDate: "2099-01-01",
        status: "Valido",
      },
      {
        key: "driverAuthorization",
        label: "Autorização do condutor",
        dueDate: "2000-01-01",
        status: "Vencido",
      },
    ]);
    expect(overview.entries[0].overallStatus).toBe("Vencido");
  });

  it("builds the company overview from CNPJ-linked associates", async () => {
    const repository: AssociateOperationRepository = {
      async findByOperationType() {
        return [
          {
            associate: {
              id: "asc_company_01",
              name: "Empresa Modelo",
              category: "Titular",
              registrationNumber: "MAT-2026-0201",
              status: "Ativo",
            },
            profile: {
              associateId: "asc_company_01",
              operationType: "Empresa",
              basicDocumentationDueDate: "2099-01-01",
              vehicleAuthorizationDueDate: null,
              driverAuthorizationDueDate: null,
              cargoLicensingDueDate: null,
              createdAt: "2026-04-01T10:00:00.000Z",
              updatedAt: "2026-04-01T10:00:00.000Z",
            },
          },
        ];
      },
    };

    const service = createAssociateOperationService({ repository });
    const overview = await service.getOperationOverview("Empresa");

    expect(overview.operationType).toBe("Empresa");
    expect(overview.metrics).toEqual({
      totalAssociates: 1,
      valid: 1,
      attention: 0,
      critical: 0,
    });
    expect(overview.entries[0].requirements).toEqual([
      {
        key: "companyDocumentation",
        label: "Documentação empresarial",
        dueDate: "2099-01-01",
        status: "Valido",
      },
    ]);
  });
});

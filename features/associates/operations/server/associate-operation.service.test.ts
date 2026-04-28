import { createAssociateOperationService } from "@/features/associates/operations/server/associate-operation.service";
import type { AssociateOperationRepository } from "@/features/associates/operations/server/associate-operation.repository";
import type { DocumentRepository } from "@/features/data/repositories/document-repository";

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
    const documentRepository: Pick<DocumentRepository, "listAll"> = {
      async listAll() {
        return [
          {
            id: "doc_school_vehicle",
            name: "Autorizacao veiculo",
            owner: "Operacao",
            documentType: "AUTORIZACAO_VEICULO",
            status: "Atencao",
            dueDate: "2099-06-01",
            associateId: "asc_school_01",
            associateName: "Escola Modelo",
            associateRegistrationNumber: "MAT-2026-0101",
            associateCategory: "ESCOLAR",
            notes: null,
          },
          {
            id: "doc_school_driver",
            name: "Autorizacao condutor",
            owner: "Operacao",
            documentType: "AUTORIZACAO_CONDUTOR",
            status: "Valido",
            dueDate: "2099-08-15",
            associateId: "asc_school_01",
            associateName: "Escola Modelo",
            associateRegistrationNumber: "MAT-2026-0101",
            associateCategory: "ESCOLAR",
            notes: null,
          },
        ];
      },
    };

    const service = createAssociateOperationService({
      repository,
      documentRepository,
    });
    const overview = await service.getOperationOverview("TransporteEscolar");

    expect(overview.operationType).toBe("TransporteEscolar");
    expect(overview.metrics).toEqual({
      totalAssociates: 1,
      valid: 0,
      attention: 1,
      critical: 0,
    });
    expect(overview.entries).toHaveLength(1);
    expect(overview.entries[0].requirements).toEqual([
      {
        key: "vehicleAuthorization",
        label: "Autorizacao do veiculo",
        dueDate: "2099-06-01",
        status: "Atencao",
      },
      {
        key: "driverAuthorization",
        label: "Autorizacao do condutor",
        dueDate: "2099-08-15",
        status: "Valido",
      },
    ]);
    expect(overview.entries[0].overallStatus).toBe("Atencao");
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
    const documentRepository: Pick<DocumentRepository, "listAll"> = {
      async listAll() {
        return [];
      },
    };

    const service = createAssociateOperationService({
      repository,
      documentRepository,
    });
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
        label: "Documentacao empresarial",
        dueDate: "2099-01-01",
        status: "Valido",
      },
    ]);
  });
});

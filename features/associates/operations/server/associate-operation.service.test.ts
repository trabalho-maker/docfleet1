import { createAssociateOperationService } from "@/features/associates/operations/server/associate-operation.service";
import type { AssociateOperationRepository } from "@/features/associates/operations/server/associate-operation.repository";
import type { DocumentRepository } from "@/features/data/repositories/document-repository";
import type { DocumentType } from "@/features/documents/constants";

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
    const listByAssociateIds = jest.fn<
      ReturnType<Pick<DocumentRepository, "listByAssociateIds">["listByAssociateIds"]>,
      Parameters<Pick<DocumentRepository, "listByAssociateIds">["listByAssociateIds"]>
    >(async (associateIds, filters) => {
      expect(associateIds).toEqual(["asc_school_01"]);
      expect(filters).toEqual({
        documentTypes: [
          "AUTORIZACAO_VEICULO",
          "AUTORIZACAO_CONDUTOR",
        ] satisfies DocumentType[],
      });

      return [
        {
          id: "doc_school_vehicle",
          name: "Autorização veículo",
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
          name: "Autorização condutor",
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
    });
    const documentRepository: Pick<DocumentRepository, "listByAssociateIds"> = {
      async listByAssociateIds(associateIds, filters) {
        return listByAssociateIds(associateIds, filters);
      },
    };

    const service = createAssociateOperationService({
      repository,
      documentRepository,
    });
    const overview = await service.getOperationOverview("TransporteEscolar");

    expect(listByAssociateIds).toHaveBeenCalledTimes(1);
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
        label: "Autorização do veículo",
        dueDate: "2099-06-01",
        status: "Atencao",
      },
      {
        key: "driverAuthorization",
        label: "Autorização do condutor",
        dueDate: "2099-08-15",
        status: "Valido",
      },
    ]);
    expect(overview.entries[0].overallStatus).toBe("Atencao");
  });

  it("keeps operational fallback without querying documents when the operation has no official type mapping", async () => {
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
    const listByAssociateIds = jest.fn<
      ReturnType<Pick<DocumentRepository, "listByAssociateIds">["listByAssociateIds"]>,
      Parameters<Pick<DocumentRepository, "listByAssociateIds">["listByAssociateIds"]>
    >();
    const documentRepository: Pick<DocumentRepository, "listByAssociateIds"> = {
      async listByAssociateIds(associateIds, filters) {
        return listByAssociateIds(associateIds, filters);
      },
    };

    const service = createAssociateOperationService({
      repository,
      documentRepository,
    });
    const overview = await service.getOperationOverview("Empresa");

    expect(overview.operationType).toBe("Empresa");
    expect(listByAssociateIds).not.toHaveBeenCalled();
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

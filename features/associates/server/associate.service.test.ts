import {
  resetSqliteDatabase,
  resetSqliteStorageState,
  withSqliteDatabase,
} from "@/lib/storage/sqlite-storage";
import { SqliteAssociateRepository } from "@/features/associates/server/associate.repository";
import {
  AssociateConflictError,
  AssociateNotFoundError,
  createAssociateService,
} from "@/features/associates/server/associate.service";
import { createDataLayer } from "@/features/data/repositories";
import { createDocumentWithAlerts } from "@/features/documents/server/document-service";

describe("associate service", () => {
  const repository = new SqliteAssociateRepository();
  const service = createAssociateService();

  beforeEach(async () => {
    await resetSqliteStorageState();
    await resetSqliteDatabase();
  });

  afterAll(async () => {
    await resetSqliteStorageState();
  });

  it("creates an associate with normalized CPF", async () => {
    const created = await service.createAssociate({
      name: "Carlos Alberto",
      cpf: "529.982.247-25",
      category: "Titular",
      registrationNumber: "MAT-2026-0100",
      status: "Ativo",
      admissionDate: "2025-03-20",
    });

    expect(created.cpf).toBe("52998224725");
    expect(created.registrationNumber).toBe("MAT-2026-0100");
    expect(created.enderecoCompleto).toBeNull();
  });

  it("rejects duplicate CPF on create", async () => {
    await expect(
      service.createAssociate({
        name: "Outra Maria",
        cpf: "390.533.447-05",
        category: "Titular",
        registrationNumber: "MAT-2026-0200",
        status: "Ativo",
        admissionDate: "2024-06-01",
      }),
    ).rejects.toThrow(AssociateConflictError);
  });

  it("updates an existing associate", async () => {
    const updated = await service.updateAssociate("asc_01", {
      name: "Maria de Souza Lima",
      status: "Inativo",
      enderecoCompleto: "Rua 1, 200",
      cidade: "Rio Claro",
      estado: "SP",
      observacoes: "Associada com ficha completa.",
    });

    expect(updated.name).toBe("Maria de Souza Lima");
    expect(updated.status).toBe("Inativo");
    expect(updated.enderecoCompleto).toBe("Rua 1, 200");
    expect(updated.cidade).toBe("Rio Claro");
    expect(updated.estado).toBe("SP");
  });

  it("deletes an existing associate", async () => {
    await service.deleteAssociate("asc_03");

    await expect(service.getAssociateById("asc_03")).rejects.toThrow(
      AssociateNotFoundError,
    );
  });

  it("deletes an associate without leaving orphaned records", async () => {
    const dataLayer = createDataLayer();
    const generatedDocument = await createDocumentWithAlerts({
      associateId: "asc_01",
      documentType: "TACOGRAFO",
      dueDate: "2000-01-03",
      owner: "Equipe Operacional",
      notes: "Documento para validar cascata.",
    });

    await service.deleteAssociate("asc_01");

    await expect(service.getAssociateById("asc_01")).rejects.toThrow(
      AssociateNotFoundError,
    );
    expect(await dataLayer.documents.findByAssociateId("asc_01")).toHaveLength(0);
    expect(
      await dataLayer.alerts.findGeneratedBySourceDocumentId(generatedDocument.id),
    ).toBeNull();

    await withSqliteDatabase((db) => {
      const associateProfiles =
        Number(
          db.exec(
            "SELECT COUNT(*) FROM associate_profiles WHERE associate_id = ?",
            ["asc_01"],
          )[0]?.values[0]?.[0],
        ) || 0;
      const operationProfiles =
        Number(
          db.exec(
            "SELECT COUNT(*) FROM associate_operation_profiles WHERE associate_id = ?",
            ["asc_01"],
          )[0]?.values[0]?.[0],
        ) || 0;
      const taxistaProfiles =
        Number(
          db.exec(
            "SELECT COUNT(*) FROM taxista_profiles WHERE associate_id = ?",
            ["asc_01"],
          )[0]?.values[0]?.[0],
        ) || 0;

      expect({
        associateProfiles,
        operationProfiles,
        taxistaProfiles,
      }).toEqual({
        associateProfiles: 0,
        operationProfiles: 0,
        taxistaProfiles: 0,
      });
    });
  });

  it("rolls back the associate creation flow when profile persistence fails", async () => {
    const failingService = createAssociateService({
      profileRepositoryFactory: () => ({
        findByAssociateId: async () => null,
        upsertByAssociateId: async () => {
          throw new Error("PROFILE_WRITE_FAILED");
        },
        removeByAssociateId: async () => undefined,
      }),
    });

    await expect(
      failingService.createAssociate({
        name: "Carlos Alberto",
        cpf: "529.982.247-25",
        category: "Titular",
        registrationNumber: "MAT-2026-0100",
        status: "Ativo",
        admissionDate: "2025-03-20",
      }),
    ).rejects.toThrow("PROFILE_WRITE_FAILED");

    expect(await repository.findByRegistrationNumber("MAT-2026-0100")).toBeNull();
  });

  it("filters associates by search, CPF, category and status", async () => {
    const byName = await service.listAssociates({ search: "Maria" });
    const byCpf = await service.listAssociates({ search: "390.533.447-05" });
    const byCategoryAndStatus = await service.listAssociates({
      category: "Contribuinte",
      status: "Suspenso",
    });

    expect(byName).toHaveLength(1);
    expect(byName[0]?.id).toBe("asc_01");
    expect(byCpf).toHaveLength(1);
    expect(byCpf[0]?.id).toBe("asc_01");
    expect(byCategoryAndStatus).toHaveLength(1);
    expect(byCategoryAndStatus[0]?.id).toBe("asc_02");
  });

  it("returns aggregate metrics from the full base", async () => {
    const [total, byStatus, byCategory] = await Promise.all([
      service.countAllAssociates(),
      service.countByStatus(),
      service.countByCategory(),
    ]);

    expect(total).toBe(4);
    expect(byStatus).toMatchObject({
      Ativo: 3,
      Inativo: 0,
      Suspenso: 1,
      Bloqueado: 0,
    });
    expect(byCategory).toMatchObject({
      Titular: 2,
      Dependente: 1,
      Pensionista: 0,
      Contribuinte: 1,
    });
  });
});

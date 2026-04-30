import {
  resetSqliteDatabase,
  resetSqliteStorageState,
  withSqliteDatabase,
  withSqliteWriteLock,
} from "@/lib/storage/sqlite-storage";
import { SqliteAssociateRepository } from "@/features/associates/server/associate.repository";
import { SqliteMembershipFeeRepository } from "@/features/membership-fees/server/membership-fee.repository";
import {
  AssociateConflictError,
  AssociateNotFoundError,
  createAssociateService,
} from "@/features/associates/server/associate.service";
import { createDataLayer } from "@/features/data/repositories";
import { createDocumentWithAlerts } from "@/features/documents/server/document-service";

describe("associate service", () => {
  const repository = new SqliteAssociateRepository();
  const membershipFeeRepository = new SqliteMembershipFeeRepository();
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
    await expect(
      membershipFeeRepository.findSheetByAssociateIdAndYear(
        created.id,
        new Date().getUTCFullYear(),
      ),
    ).resolves.toMatchObject({
      associateId: created.id,
      referenceYear: new Date().getUTCFullYear(),
      status: "active",
      snapshotName: "Carlos Alberto",
    });
  });

  it("keeps a created associate after the storage layer is restarted", async () => {
    const created = await service.createAssociate({
      name: "Renata Campos",
      cpf: "111.444.777-35",
      category: "Titular",
      registrationNumber: "MAT-2026-0101",
      status: "Ativo",
      admissionDate: "2025-04-01",
    });

    await resetSqliteStorageState();

    const reloaded = await service.getAssociateById(created.id);

    expect(reloaded).toMatchObject({
      id: created.id,
      name: "Renata Campos",
      cpf: "11144477735",
      registrationNumber: "MAT-2026-0101",
    });
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

  it("rejects duplicate RG on create after normalization", async () => {
    await expect(
      service.createAssociate({
        name: "Outra Maria",
        cpf: "529.982.247-25",
        category: "Titular",
        registrationNumber: "MAT-2026-0200",
        status: "Ativo",
        admissionDate: "2024-06-01",
        rg: "28 456 789-0",
      }),
    ).rejects.toThrow("ASSOCIATE_RG_ALREADY_EXISTS");
  });

  it("rejects duplicate CNH on create after normalization", async () => {
    await expect(
      service.createAssociate({
        name: "Outra Maria",
        cpf: "529.982.247-25",
        category: "Titular",
        registrationNumber: "MAT-2026-0200",
        status: "Ativo",
        admissionDate: "2024-06-01",
        cnh: "0123 4567-890",
      }),
    ).rejects.toThrow("ASSOCIATE_CNH_ALREADY_EXISTS");
  });

  it("rejects duplicate company CNPJ on create after normalization", async () => {
    await expect(
      service.createAssociate({
        name: "Outra Empresa",
        cpf: "529.982.247-25",
        category: "Titular",
        registrationNumber: "MAT-2026-0200",
        status: "Ativo",
        admissionDate: "2024-06-01",
        modalidadeAssociado: "CNPJ",
        nomeEmpresa: "Nova Empresa",
        cnpjEmpresa: "27.865.757/0001-02",
      }),
    ).rejects.toThrow("ASSOCIATE_COMPANY_CNPJ_ALREADY_EXISTS");
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

  it("allows keeping the same RG, CNH and company CNPJ on the same associate update", async () => {
    const updatedCompany = await service.updateAssociate("asc_04", {
      rg: null,
      cnh: null,
      cnpjEmpresa: "27.865.757/0001-02",
      nomeEmpresa: "Transporte Azul Logística Ltda.",
    });
    const updatedPerson = await service.updateAssociate("asc_01", {
      rg: "28.456.789-0",
      cnh: "0123 4567-890",
    });

    expect(updatedCompany.cnpjEmpresa).toBe("27865757000102");
    expect(updatedPerson.rg).toBe("284567890");
    expect(updatedPerson.cnh).toBe("01234567890");
  });

  it("rejects using another associate RG, CNH or company CNPJ on update", async () => {
    await expect(
      service.updateAssociate("asc_02", {
        rg: "28.456.789-0",
      }),
    ).rejects.toThrow("ASSOCIATE_RG_ALREADY_EXISTS");

    await expect(
      service.updateAssociate("asc_02", {
        cnh: "0123 4567-890",
      }),
    ).rejects.toThrow("ASSOCIATE_CNH_ALREADY_EXISTS");

    await expect(
      service.updateAssociate("asc_02", {
        modalidadeAssociado: "CNPJ",
        nomeEmpresa: "Empresa Escolar",
        cnpjEmpresa: "27.865.757/0001-02",
      }),
    ).rejects.toThrow("ASSOCIATE_COMPANY_CNPJ_ALREADY_EXISTS");
  });

  it("ignores blank RG, CNH and company CNPJ when checking uniqueness", async () => {
    await expect(
      service.createAssociate({
        name: "Carlos Alberto",
        cpf: "529.982.247-25",
        category: "Titular",
        registrationNumber: "MAT-2026-0100",
        status: "Ativo",
        admissionDate: "2025-03-20",
        rg: null,
        cnh: null,
        cnpjEmpresa: null,
      }),
    ).resolves.toMatchObject({
      registrationNumber: "MAT-2026-0100",
    });
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
          )[0]?.values?.[0]?.[0],
        ) || 0;
      const operationProfiles =
        Number(
          db.exec(
            "SELECT COUNT(*) FROM associate_operation_profiles WHERE associate_id = ?",
            ["asc_01"],
          )[0]?.values?.[0]?.[0],
        ) || 0;
      const taxistaProfiles =
        Number(
          db.exec(
            "SELECT COUNT(*) FROM taxista_profiles WHERE associate_id = ?",
            ["asc_01"],
          )[0]?.values?.[0]?.[0],
        ) || 0;
      const membershipFeeSheets =
        Number(
          db.exec(
            "SELECT COUNT(*) FROM membership_fee_sheets WHERE associate_id = ?",
            ["asc_01"],
          )[0]?.values?.[0]?.[0],
        ) || 0;
      const membershipFeePayments =
        Number(
          db.exec(
            "SELECT COUNT(*) FROM membership_fee_payments WHERE associate_id = ?",
            ["asc_01"],
          )[0]?.values?.[0]?.[0],
        ) || 0;

      expect({
        associateProfiles,
        operationProfiles,
        taxistaProfiles,
        membershipFeeSheets,
        membershipFeePayments,
      }).toEqual({
        associateProfiles: 0,
        operationProfiles: 0,
        taxistaProfiles: 0,
        membershipFeeSheets: 0,
        membershipFeePayments: 0,
      });
    });
  });

  it("rolls back the associate creation flow when profile persistence fails", async () => {
    const failingService = createAssociateService({
      profileRepositoryFactory: () => ({
        findByAssociateId: async () => null,
        findByRg: async () => null,
        findByCnh: async () => null,
        findByCompanyCnpj: async () => null,
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
    await withSqliteDatabase((db) => {
      const totalSheets =
        Number(
          db.exec("SELECT COUNT(*) FROM membership_fee_sheets")[0]?.values?.[0]?.[0],
        ) || 0;

      expect(totalSheets).toBe(0);
    });
  });

  it("filters associates by search, CPF, category, modalidade and status", async () => {
    const byName = await service.listAssociates({ search: "Maria" });
    const byCpf = await service.listAssociates({ search: "390.533.447-05" });
    const byModalidade = await service.listAssociates({
      modalidadeAssociado: "TAXI",
    });
    const byCategoryAndStatus = await service.listAssociates({
      category: "Contribuinte",
      status: "Inativo",
    });

    expect(byName).toHaveLength(1);
    expect(byName[0]?.id).toBe("asc_01");
    expect(byCpf).toHaveLength(1);
    expect(byCpf[0]?.id).toBe("asc_01");
    expect(byModalidade).toHaveLength(1);
    expect(byModalidade[0]?.id).toBe("asc_01");
    expect(byCategoryAndStatus).toHaveLength(1);
    expect(byCategoryAndStatus[0]?.id).toBe("asc_02");
  });

  it("supports paginated associate listings and filtered totals", async () => {
    const firstPage = await service.listAssociates({ page: 1, pageSize: 2 });
    const secondPage = await service.listAssociates({ page: 2, pageSize: 2 });
    const totalTaxi = await service.countAssociates({
      modalidadeAssociado: "TAXI",
    });

    expect(firstPage).toHaveLength(2);
    expect(secondPage).toHaveLength(2);
    expect(totalTaxi).toBe(1);
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
      Inativo: 1,
      Suspenso: 0,
      Bloqueado: 0,
    });
    expect(byCategory).toMatchObject({
      Titular: 2,
      Dependente: 1,
      Pensionista: 0,
      Contribuinte: 1,
    });
  });

  it("keeps legacy suspended associates readable in listings and aggregates", async () => {
    await withSqliteWriteLock((db) => {
      db.run(
        `INSERT INTO associates (
          id,
          name,
          cpf,
          category,
          registration_number,
          status,
          admission_date,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "asc_legacy_suspenso",
          "Associado Legado",
          "12345678909",
          "Titular",
          "MAT-LEG-0001",
          "Suspenso",
          "2020-01-15",
          "2026-04-06T09:00:00.000Z",
          "2026-04-06T09:00:00.000Z",
        ],
      );
    });

    const legacyResults = await service.listAssociates({ status: "Suspenso" });
    const counts = await service.countByStatus();

    expect(legacyResults).toHaveLength(1);
    expect(legacyResults[0]).toMatchObject({
      id: "asc_legacy_suspenso",
      status: "Suspenso",
    });
    expect(counts.Suspenso).toBe(1);
  });
});

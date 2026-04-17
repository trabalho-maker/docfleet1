import { SqliteAssociateOperationRepository } from "@/features/associates/operations/server/associate-operation.repository";
import {
  resetSqliteDatabase,
  resetSqliteStorageState,
  withSqliteWriteLock,
} from "@/lib/storage/sqlite-storage";

describe("associate operation repository", () => {
  const repository = new SqliteAssociateOperationRepository();

  beforeEach(async () => {
    await resetSqliteStorageState();
    await resetSqliteDatabase();
  });

  afterAll(async () => {
    await resetSqliteStorageState();
  });

  it("filters associates by operation type in the backend", async () => {
    const records = await repository.findByOperationType("TransporteEscolar");

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      associate: {
        id: "asc_02",
        name: "João Pereira",
        registrationNumber: "MAT-2026-0002",
      },
      profile: {
        associateId: "asc_02",
        operationType: "TransporteEscolar",
      },
    });
  });

  it("returns only the operational associate fields needed by the category pages", async () => {
    const [record] = await repository.findByOperationType("Taxista");

    expect(record.associate).toEqual({
      id: "asc_01",
      name: "Maria de Souza",
      category: "Titular",
      registrationNumber: "MAT-2026-0001",
      status: "Ativo",
    });
  });

  it("lists TAXI associates from the saved profile even before operational dates exist", async () => {
    await withSqliteWriteLock((db) => {
      db.run(
        "DELETE FROM associate_operation_profiles WHERE associate_id = ?",
        ["asc_01"],
      );
    });

    const [record] = await repository.findByOperationType("Taxista");

    expect(record).toMatchObject({
      associate: {
        id: "asc_01",
        name: "Maria de Souza",
        registrationNumber: "MAT-2026-0001",
      },
      profile: {
        associateId: "asc_01",
        operationType: "Taxista",
        basicDocumentationDueDate: null,
      },
    });
  });

  it("stops listing the associate when the saved profile is changed away from TAXI", async () => {
    await withSqliteWriteLock((db) => {
      db.run(
        "UPDATE associate_profiles SET modalidade_associado = ? WHERE associate_id = ?",
        ["CAMINHAO", "asc_01"],
      );
    });

    const records = await repository.findByOperationType("Taxista");

    expect(records).toHaveLength(0);
  });

  it("lists company associates from the detailed profile when the associate is CNPJ", async () => {
    const records = await repository.findByOperationType("Empresa");

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      associate: {
        id: "asc_04",
        name: "Transporte Azul Logística",
        registrationNumber: "MAT-2026-0004",
        status: "Ativo",
      },
      profile: {
        associateId: "asc_04",
        operationType: "Empresa",
      },
    });
  });
});

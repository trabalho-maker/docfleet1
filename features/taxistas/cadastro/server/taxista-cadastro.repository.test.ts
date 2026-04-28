import { SqliteTaxistaCadastroRepository } from "@/features/taxistas/cadastro/server/taxista-cadastro.repository";
import {
  resetSqliteDatabase,
  resetSqliteStorageState,
  withSqliteWriteLock,
} from "@/lib/storage/sqlite-storage";

jest.setTimeout(15000);

describe("taxista cadastro repository", () => {
  const repository = new SqliteTaxistaCadastroRepository();

  beforeEach(async () => {
    await resetSqliteStorageState();
    await resetSqliteDatabase();
  });

  afterAll(async () => {
    await resetSqliteStorageState();
  });

  it("lists only TAXI associates from the real associate base in alphabetical order", async () => {
    await withSqliteWriteLock((db) => {
      db.run(
        "INSERT INTO associates (id, name, cpf, category, registration_number, status, admission_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          "asc_09",
          "Aline Prado",
          "12345678909",
          "Titular",
          "MAT-2026-0009",
          "Ativo",
          "2026-01-01",
          "2026-04-06T09:10:00.000Z",
          "2026-04-06T09:10:00.000Z",
        ],
      );
      db.run(
        "INSERT INTO associate_profiles (associate_id, modalidade_associado, telefone, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        [
          "asc_09",
          "TAXI",
          "(19) 99999-0009",
          "2026-04-06T09:10:00.000Z",
          "2026-04-06T09:10:00.000Z",
        ],
      );
    });

    const result = await repository.findMany();

    expect(result.records.map((record) => record.name)).toEqual([
      "Aline Prado",
      "Maria de Souza",
    ]);
    expect(result.counts).toEqual({
      all: 2,
      protocolado: 0,
      pronto: 0,
    });
  });

  it("filters and paginates taxistas directly in SQL", async () => {
    await withSqliteWriteLock((db) => {
      db.run(
        "INSERT INTO associates (id, name, cpf, category, registration_number, status, admission_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          "asc_10",
          "Alvaro Mendes",
          "11122233344",
          "Titular",
          "MAT-2026-0010",
          "Ativo",
          "2026-01-02",
          "2026-04-06T09:10:00.000Z",
          "2026-04-06T09:10:00.000Z",
        ],
      );
      db.run(
        "INSERT INTO associate_profiles (associate_id, modalidade_associado, telefone, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        [
          "asc_10",
          "TAXI",
          "(19) 99999-0010",
          "2026-04-06T09:10:00.000Z",
          "2026-04-06T09:10:00.000Z",
        ],
      );
      db.run(
        "INSERT INTO taxista_profiles (associate_id, status_alvara, selo, placa, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
        [
          "asc_10",
          "PROTOCOLADO",
          "SL-100",
          "ABC-1234",
          "2026-04-06T09:10:00.000Z",
          "2026-04-06T09:10:00.000Z",
        ],
      );
      db.run(
        "INSERT INTO associates (id, name, cpf, category, registration_number, status, admission_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          "asc_11",
          "Beatriz Costa",
          "55566677788",
          "Titular",
          "MAT-2026-0011",
          "Ativo",
          "2026-01-03",
          "2026-04-06T09:10:00.000Z",
          "2026-04-06T09:10:00.000Z",
        ],
      );
      db.run(
        "INSERT INTO associate_profiles (associate_id, modalidade_associado, telefone, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        [
          "asc_11",
          "TAXI",
          "(19) 99999-0011",
          "2026-04-06T09:10:00.000Z",
          "2026-04-06T09:10:00.000Z",
        ],
      );
      db.run(
        "INSERT INTO taxista_profiles (associate_id, status_alvara, selo, placa, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
        [
          "asc_11",
          "PRONTO",
          "SL-200",
          "XYZ-9876",
          "2026-04-06T09:10:00.000Z",
          "2026-04-06T09:10:00.000Z",
        ],
      );
    });

    const nameSearch = await repository.findMany({ search: "alvaro" });
    expect(nameSearch.records.map((record) => record.associateId)).toEqual(["asc_10"]);

    const cpfSearch = await repository.findMany({ search: "390.533.447-05" });
    expect(cpfSearch.records.map((record) => record.associateId)).toEqual(["asc_01"]);

    const seloSearch = await repository.findMany({ search: "sl100" });
    expect(seloSearch.records.map((record) => record.associateId)).toEqual(["asc_10"]);

    const placaSearch = await repository.findMany({ search: "xyz9876" });
    expect(placaSearch.records.map((record) => record.associateId)).toEqual(["asc_11"]);

    const protocoladoPage = await repository.findMany({
      mode: "PROTOCOLADO",
      page: 1,
      pageSize: 1,
    });
    expect(protocoladoPage.total).toBe(1);
    expect(protocoladoPage.totalPages).toBe(1);
    expect(protocoladoPage.records.map((record) => record.associateId)).toEqual([
      "asc_10",
    ]);

    const pagedResult = await repository.findMany({
      page: 2,
      pageSize: 1,
    });
    expect(pagedResult.total).toBe(3);
    expect(pagedResult.totalPages).toBe(3);
    expect(pagedResult.records).toHaveLength(1);
  });

  it("saves associate, profile and taxista fields together in one cadastro update", async () => {
    await repository.saveCadastro("asc_01", {
      name: "Maria de Souza Atualizada",
      cpf: "39053344705",
      telefone: "(19) 97777-1000",
      endereco: "Avenida 5, 123",
      statusAlvara: "PROTOCOLADO",
      selo: "SL-9999",
      ponto: "Praca Central",
      placa: "ABC-1234",
      modeloVeiculo: "Toyota Corolla",
      pressaoKgfM2: "34",
      numeroTaximetro: "TX-00001",
      modeloTaximetro: "Modelo X",
      constante: "K-900",
      inmetro: "INM-900",
      instalacao: "2026-01-01",
      trocaTaximetro: null,
      pneu: "Novo",
      deca: "DECA-99",
      lacreModulo: "LM-9999",
      lacreTaxi: "LT-9999",
      modulo: "MD-999",
      cinta: "CI-99",
      colocado: "2026-02-01",
      retirado: null,
      observacao: "Ultima alteracao em 23/04/2026 as 10:15 - alterados: placa, ponto",
    });

    const record = await repository.findByAssociateId("asc_01");

    expect(record).toMatchObject({
      associateId: "asc_01",
      name: "Maria de Souza Atualizada",
      cpf: "39053344705",
      telefone: "(19) 97777-1000",
      endereco: "Avenida 5, 123",
      statusAlvara: "PROTOCOLADO",
      selo: "SL-9999",
      ponto: "Praca Central",
      placa: "ABC-1234",
      pressaoKgfM2: "34",
      numeroTaximetro: "TX-00001",
      observacao: "Ultima alteracao em 23/04/2026 as 10:15 - alterados: placa, ponto",
    });
  });

  it("clears ready statuses back to cadastro without removing the taxista rows", async () => {
    await repository.updateStatusAlvara("asc_01", "PRONTO");

    await repository.clearReadyStatuses();

    const record = await repository.findByAssociateId("asc_01");
    expect(record?.statusAlvara).toBe("CADASTRO");
  });
});

import { SqliteTaxistaCadastroRepository } from "@/features/taxistas/cadastro/server/taxista-cadastro.repository";
import {
  resetSqliteDatabase,
  resetSqliteStorageState,
  withSqliteWriteLock,
} from "@/lib/storage/sqlite-storage";

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

    const records = await repository.findMany();

    expect(records.map((record) => record.name)).toEqual([
      "Aline Prado",
      "Maria de Souza",
    ]);
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

import {
  countTaxistaCadastroRecords,
  filterTaxistaCadastroRecords,
  sortTaxistaCadastroRecords,
} from "@/features/taxistas/cadastro/lib/taxista-cadastro-filters";
import type { TaxistaCadastroRecord } from "@/features/taxistas/cadastro/types";

const baseRecord: TaxistaCadastroRecord = {
  associateId: "asc_base",
  name: "Taxista Base",
  cpf: "39053344705",
  telefone: null,
  endereco: null,
  registrationNumber: "MAT-2026-0001",
  status: "Ativo",
  statusAlvara: "CADASTRO",
  selo: null,
  ponto: null,
  placa: null,
  modeloVeiculo: null,
  pressaoKgfM2: null,
  numeroTaximetro: null,
  modeloTaximetro: null,
  constante: null,
  inmetro: null,
  instalacao: null,
  trocaTaximetro: null,
  pneu: null,
  deca: null,
  lacreModulo: null,
  lacreTaxi: null,
  modulo: null,
  cinta: null,
  colocado: null,
  retirado: null,
  observacao: null,
};

describe("taxista cadastro filters", () => {
  const records: TaxistaCadastroRecord[] = [
    {
      ...baseRecord,
      associateId: "asc_03",
      name: "Zelia Santos",
      cpf: "33344455566",
      statusAlvara: "PRONTO",
      selo: "SL-300",
      placa: "ABC-1234",
    },
    {
      ...baseRecord,
      associateId: "asc_01",
      name: "Álvaro Mendes",
      cpf: "11122233344",
      statusAlvara: "CADASTRO",
      selo: "SL-100",
      placa: "FKD-3241",
    },
    {
      ...baseRecord,
      associateId: "asc_02",
      name: "Bruna Lima",
      cpf: "22233344455",
      statusAlvara: "PROTOCOLADO",
      selo: "SL-200",
      placa: "XYZ-9876",
    },
  ];

  it("sorts the records alphabetically before rendering the grid", () => {
    expect(sortTaxistaCadastroRecords(records).map((record) => record.name)).toEqual([
      "Álvaro Mendes",
      "Bruna Lima",
      "Zelia Santos",
    ]);
  });

  it("filters the loaded records by name, cpf, selo and placa", () => {
    expect(
      filterTaxistaCadastroRecords(records, { query: "alvaro" }).map(
        (record) => record.associateId,
      ),
    ).toEqual(["asc_01"]);
    expect(
      filterTaxistaCadastroRecords(records, { query: "22233344455" }).map(
        (record) => record.associateId,
      ),
    ).toEqual(["asc_02"]);
    expect(
      filterTaxistaCadastroRecords(records, { query: "sl300" }).map(
        (record) => record.associateId,
      ),
    ).toEqual(["asc_03"]);
    expect(
      filterTaxistaCadastroRecords(records, { query: "fkd3241" }).map(
        (record) => record.associateId,
      ),
    ).toEqual(["asc_01"]);
  });

  it("applies the protocolado and pronto filters without affecting the alphabetical order", () => {
    expect(
      filterTaxistaCadastroRecords(sortTaxistaCadastroRecords(records), {
        mode: "PROTOCOLADO",
      }).map((record) => record.associateId),
    ).toEqual(["asc_02"]);
    expect(
      filterTaxistaCadastroRecords(sortTaxistaCadastroRecords(records), {
        mode: "PRONTO",
      }).map((record) => record.associateId),
    ).toEqual(["asc_03"]);
  });

  it("builds the dashboard counters from the same record source", () => {
    expect(countTaxistaCadastroRecords(records)).toEqual({
      all: 3,
      protocolado: 1,
      pronto: 1,
    });
  });
});

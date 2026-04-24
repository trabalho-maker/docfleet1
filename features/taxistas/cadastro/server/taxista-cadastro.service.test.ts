import { AssociateConflictError } from "@/features/associates/server/associate.service";
import { createTaxistaCadastroService } from "@/features/taxistas/cadastro/server/taxista-cadastro.service";
import type {
  TaxistaCadastroRepository,
} from "@/features/taxistas/cadastro/server/taxista-cadastro.repository";
import type { TaxistaCadastroRecord } from "@/features/taxistas/cadastro/types";

const baseRecord: TaxistaCadastroRecord = {
  associateId: "asc_01",
  name: "Maria de Souza",
  cpf: "39053344705",
  telefone: "(19) 99888-0001",
  endereco: "Rua 1, 200 - Centro",
  registrationNumber: "MAT-2026-0001",
  status: "Ativo",
  statusAlvara: "CADASTRO",
  selo: "SL-0241",
  ponto: "Rodoviaria Central",
  placa: "FKD-3241",
  modeloVeiculo: "Chevrolet Spin",
  pressaoKgfM2: "32",
  numeroTaximetro: "TX-98124",
  modeloTaximetro: "Fiphot 7000",
  constante: "K-824",
  inmetro: "INM-2026-451",
  instalacao: "2025-11-18",
  trocaTaximetro: null,
  pneu: "Revisado",
  deca: "DECA-22",
  lacreModulo: "LM-4451",
  lacreTaxi: "LT-8830",
  modulo: "MD-140",
  cinta: "CI-19",
  colocado: "2026-02-12",
  retirado: null,
  observacao: "Ultima alteracao em 06/04/2026 as 08:58 - alterados: selo",
};

function createRepositoryMock(): jest.Mocked<TaxistaCadastroRepository> {
  return {
    findMany: jest.fn().mockResolvedValue([baseRecord]),
    findByAssociateId: jest.fn().mockResolvedValue(baseRecord),
    saveCadastro: jest.fn().mockResolvedValue(undefined),
    upsertProfile: jest.fn().mockResolvedValue({
      associateId: baseRecord.associateId,
      statusAlvara: baseRecord.statusAlvara,
      selo: baseRecord.selo,
      ponto: baseRecord.ponto,
      placa: baseRecord.placa,
      modeloVeiculo: baseRecord.modeloVeiculo,
      pressaoKgfM2: baseRecord.pressaoKgfM2,
      numeroTaximetro: baseRecord.numeroTaximetro,
      modeloTaximetro: baseRecord.modeloTaximetro,
      constante: baseRecord.constante,
      inmetro: baseRecord.inmetro,
      instalacao: baseRecord.instalacao,
      trocaTaximetro: baseRecord.trocaTaximetro,
      pneu: baseRecord.pneu,
      deca: baseRecord.deca,
      lacreModulo: baseRecord.lacreModulo,
      lacreTaxi: baseRecord.lacreTaxi,
      modulo: baseRecord.modulo,
      cinta: baseRecord.cinta,
      colocado: baseRecord.colocado,
      retirado: baseRecord.retirado,
      observacao: baseRecord.observacao,
      createdAt: "2026-04-06T08:58:00.000Z",
      updatedAt: "2026-04-06T08:58:00.000Z",
    }),
    updateStatusAlvara: jest.fn().mockResolvedValue(undefined),
    clearReadyStatuses: jest.fn().mockResolvedValue(undefined),
  };
}

describe("taxista cadastro service", () => {
  it("requires protocolado before moving the taxista to pronto", async () => {
    const repository = createRepositoryMock();
    const service = createTaxistaCadastroService({ repository });

    await expect(
      service.updateTaxistaAlvaraStatus(baseRecord.associateId, "PRONTO"),
    ).rejects.toThrow("TAXISTA_PRONTO_REQUIRES_PROTOCOLADO");
  });

  it("rejects invalid cpf values before trying to persist the modal edition", async () => {
    const repository = createRepositoryMock();
    const service = createTaxistaCadastroService({ repository });

    const result = await service.updateTaxistaCadastro(baseRecord.associateId, {
      name: "Maria de Souza",
      cpf: "11111111111",
      telefone: "",
      endereco: "",
      selo: "",
      ponto: "",
      placa: "",
      modeloVeiculo: "",
      pressaoKgfM2: "",
      numeroTaximetro: "",
      modeloTaximetro: "",
      constante: "",
      inmetro: "",
      instalacao: "",
      trocaTaximetro: "",
      pneu: "",
      deca: "",
      lacreModulo: "",
      lacreTaxi: "",
      modulo: "",
      cinta: "",
      colocado: "",
      retirado: "",
    });

    expect(result).toEqual({
      success: false,
      fieldErrors: {
        cpf: "Informe um CPF valido.",
      },
    });
    expect(repository.saveCadastro).not.toHaveBeenCalled();
  });

  it("saves the taxista edition in one repository call with normalized values", async () => {
    const repository = createRepositoryMock();
    const service = createTaxistaCadastroService({ repository });

    const result = await service.updateTaxistaCadastro(baseRecord.associateId, {
      name: "  Maria de Souza  ",
      cpf: "390.533.447-05",
      telefone: " (19) 99888-0001 ",
      endereco: " Rua 1, 200 - Centro ",
      selo: " SL-0241 ",
      ponto: " Rodoviaria Central ",
      placa: " fkd-3241 ",
      modeloVeiculo: " Chevrolet Spin ",
      pressaoKgfM2: " 33 ",
      numeroTaximetro: " TX-98124 ",
      modeloTaximetro: " Fiphot 7000 ",
      constante: " K-824 ",
      inmetro: " INM-2026-451 ",
      instalacao: "2025-11-18",
      trocaTaximetro: "",
      pneu: " Revisado ",
      deca: " DECA-22 ",
      lacreModulo: " LM-4451 ",
      lacreTaxi: " LT-8830 ",
      modulo: " MD-140 ",
      cinta: " CI-19 ",
      colocado: "2026-02-12",
      retirado: "",
    });

    expect(result).toEqual({
      success: true,
      data: {
        name: "Maria de Souza",
        cpf: "39053344705",
        telefone: "(19) 99888-0001",
        endereco: "Rua 1, 200 - Centro",
        selo: "SL-0241",
        ponto: "Rodoviaria Central",
        placa: "FKD-3241",
        modeloVeiculo: "Chevrolet Spin",
        pressaoKgfM2: "33",
        numeroTaximetro: "TX-98124",
        modeloTaximetro: "Fiphot 7000",
        constante: "K-824",
        inmetro: "INM-2026-451",
        instalacao: "2025-11-18",
        trocaTaximetro: null,
        pneu: "Revisado",
        deca: "DECA-22",
        lacreModulo: "LM-4451",
        lacreTaxi: "LT-8830",
        modulo: "MD-140",
        cinta: "CI-19",
        colocado: "2026-02-12",
        retirado: null,
      },
    });
    expect(repository.saveCadastro).toHaveBeenCalledWith(baseRecord.associateId, {
      name: "Maria de Souza",
      cpf: "39053344705",
      telefone: "(19) 99888-0001",
      endereco: "Rua 1, 200 - Centro",
      statusAlvara: "CADASTRO",
      selo: "SL-0241",
      ponto: "Rodoviaria Central",
      placa: "FKD-3241",
      modeloVeiculo: "Chevrolet Spin",
      pressaoKgfM2: "33",
      numeroTaximetro: "TX-98124",
      modeloTaximetro: "Fiphot 7000",
      constante: "K-824",
      inmetro: "INM-2026-451",
      instalacao: "2025-11-18",
      trocaTaximetro: null,
      pneu: "Revisado",
      deca: "DECA-22",
      lacreModulo: "LM-4451",
      lacreTaxi: "LT-8830",
      modulo: "MD-140",
      cinta: "CI-19",
      colocado: "2026-02-12",
      retirado: null,
      observacao: expect.stringContaining("alterados: pressao kgf/m2"),
    });
  });

  it("surfaces cpf conflicts from the transactional repository save", async () => {
    const repository = createRepositoryMock();
    repository.saveCadastro.mockRejectedValueOnce(
      new AssociateConflictError("ASSOCIATE_CPF_ALREADY_EXISTS"),
    );
    const service = createTaxistaCadastroService({ repository });

    await expect(
      service.updateTaxistaCadastro(baseRecord.associateId, {
        name: "Maria de Souza",
        cpf: "39053344705",
        telefone: "",
        endereco: "",
        selo: "",
        ponto: "",
        placa: "",
        modeloVeiculo: "",
        pressaoKgfM2: "",
        numeroTaximetro: "",
        modeloTaximetro: "",
        constante: "",
        inmetro: "",
        instalacao: "",
        trocaTaximetro: "",
        pneu: "",
        deca: "",
        lacreModulo: "",
        lacreTaxi: "",
        modulo: "",
        cinta: "",
        colocado: "",
        retirado: "",
      }),
    ).rejects.toThrow("ASSOCIATE_CPF_ALREADY_EXISTS");
  });
});

export type TaxistaAlvaraStatus = "CADASTRO" | "PROTOCOLADO" | "PRONTO";

export type TaxistaCadastroProfile = {
  associateId: string;
  statusAlvara: TaxistaAlvaraStatus;
  selo: string | null;
  ponto: string | null;
  placa: string | null;
  modeloVeiculo: string | null;
  numeroTaximetro: string | null;
  modeloTaximetro: string | null;
  constante: string | null;
  inmetro: string | null;
  instalacao: string | null;
  trocaTaximetro: string | null;
  pneu: string | null;
  deca: string | null;
  lacreModulo: string | null;
  lacreTaxi: string | null;
  modulo: string | null;
  cinta: string | null;
  colocado: string | null;
  retirado: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TaxistaCadastroRecord = {
  associateId: string;
  name: string;
  cpf: string;
  telefone: string | null;
  endereco: string | null;
  registrationNumber: string;
  status: "Ativo" | "Inativo" | "Suspenso" | "Bloqueado";
  statusAlvara: TaxistaAlvaraStatus;
  selo: string | null;
  ponto: string | null;
  placa: string | null;
  modeloVeiculo: string | null;
  numeroTaximetro: string | null;
  modeloTaximetro: string | null;
  constante: string | null;
  inmetro: string | null;
  instalacao: string | null;
  trocaTaximetro: string | null;
  pneu: string | null;
  deca: string | null;
  lacreModulo: string | null;
  lacreTaxi: string | null;
  modulo: string | null;
  cinta: string | null;
  colocado: string | null;
  retirado: string | null;
};

export type TaxistaCadastroFormValues = {
  name: string;
  cpf: string;
  telefone: string;
  endereco: string;
  selo: string;
  ponto: string;
  placa: string;
  modeloVeiculo: string;
  numeroTaximetro: string;
  modeloTaximetro: string;
  constante: string;
  inmetro: string;
  instalacao: string;
  trocaTaximetro: string;
  pneu: string;
  deca: string;
  lacreModulo: string;
  lacreTaxi: string;
  modulo: string;
  cinta: string;
  colocado: string;
  retirado: string;
};

export type TaxistaCadastroFieldErrors = Partial<
  Record<keyof TaxistaCadastroFormValues, string>
>;

export function createEmptyTaxistaCadastroProfile(
  associateId = "",
): TaxistaCadastroProfile {
  const now = new Date().toISOString();

  return {
    associateId,
    statusAlvara: "CADASTRO",
    selo: null,
    ponto: null,
    placa: null,
    modeloVeiculo: null,
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
    createdAt: now,
    updatedAt: now,
  };
}

export function mapTaxistaCadastroRecordToFormValues(
  record: TaxistaCadastroRecord,
): TaxistaCadastroFormValues {
  return {
    name: record.name,
    cpf: record.cpf,
    telefone: record.telefone ?? "",
    endereco: record.endereco ?? "",
    selo: record.selo ?? "",
    ponto: record.ponto ?? "",
    placa: record.placa ?? "",
    modeloVeiculo: record.modeloVeiculo ?? "",
    numeroTaximetro: record.numeroTaximetro ?? "",
    modeloTaximetro: record.modeloTaximetro ?? "",
    constante: record.constante ?? "",
    inmetro: record.inmetro ?? "",
    instalacao: record.instalacao ?? "",
    trocaTaximetro: record.trocaTaximetro ?? "",
    pneu: record.pneu ?? "",
    deca: record.deca ?? "",
    lacreModulo: record.lacreModulo ?? "",
    lacreTaxi: record.lacreTaxi ?? "",
    modulo: record.modulo ?? "",
    cinta: record.cinta ?? "",
    colocado: record.colocado ?? "",
    retirado: record.retirado ?? "",
  };
}

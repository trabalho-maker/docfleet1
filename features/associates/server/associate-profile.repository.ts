import type { DatabaseAdapter, DatabaseRow } from "@/lib/database/adapter";
import { getDatabaseAdapter } from "@/lib/database/provider";
import type { AssociateProfileData } from "@/features/associates/types";
import {
  normalizeAssociateCnh,
  normalizeAssociateCompanyCnpj,
  normalizeAssociateRg,
} from "@/features/associates/lib/associate-profile-identifiers";

const profileFields = [
  "modalidadeAssociado",
  "cnpjEmpresa",
  "nomeEmpresa",
  "enderecoCompleto",
  "bairro",
  "cidade",
  "estado",
  "cep",
  "profissao",
  "sexo",
  "dataNascimento",
  "nacionalidade",
  "naturalidade",
  "rg",
  "cnh",
  "estadoCivil",
  "nomePai",
  "nomeMae",
  "dependentes",
  "grauParentesco",
  "telefone",
  "celular",
  "email",
  "observacoes",
  "situacaoFinanceira",
  "situacaoDocumental",
  "historicoResumo",
  "fotoUrl",
] as const;

type AssociateProfileRecord = {
  associate_id: string;
  modalidade_associado: string | null;
  cnpj_empresa: string | null;
  nome_empresa: string | null;
  endereco_completo: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  profissao: string | null;
  sexo: string | null;
  data_nascimento: string | null;
  nacionalidade: string | null;
  naturalidade: string | null;
  rg: string | null;
  cnh: string | null;
  estado_civil: string | null;
  nome_pai: string | null;
  nome_mae: string | null;
  dependentes: string | null;
  grau_parentesco: string | null;
  telefone: string | null;
  celular: string | null;
  email: string | null;
  observacoes: string | null;
  situacao_financeira: string | null;
  situacao_documental: string | null;
  historico_resumo: string | null;
  foto_url: string | null;
  created_at: string;
  updated_at: string;
};

export interface AssociateProfileRepository {
  findByAssociateId(associateId: string): Promise<AssociateProfileData | null>;
  findByRg(rg: string): Promise<{ associateId: string } | null>;
  findByCnh(cnh: string): Promise<{ associateId: string } | null>;
  findByCompanyCnpj(cnpj: string): Promise<{ associateId: string } | null>;
  upsertByAssociateId(
    associateId: string,
    data: AssociateProfileData,
  ): Promise<AssociateProfileData>;
  removeByAssociateId(associateId: string): Promise<void>;
}

export class SqliteAssociateProfileRepository
  implements AssociateProfileRepository
{
  constructor(private readonly database: DatabaseAdapter = getDatabaseAdapter()) {}

  async findByAssociateId(associateId: string): Promise<AssociateProfileData | null> {
    const row = await this.database.queryOne(
      `
        SELECT
          associate_id,
          modalidade_associado,
          cnpj_empresa,
          nome_empresa,
          endereco_completo,
          bairro,
          cidade,
          estado,
          cep,
          profissao,
          sexo,
          data_nascimento,
          nacionalidade,
          naturalidade,
          rg,
          cnh,
          estado_civil,
          nome_pai,
          nome_mae,
          dependentes,
          grau_parentesco,
          telefone,
          celular,
          email,
          observacoes,
          situacao_financeira,
          situacao_documental,
          historico_resumo,
          foto_url,
          created_at,
          updated_at
        FROM associate_profiles
        WHERE associate_id = ?
        LIMIT 1
      `,
      [associateId],
    );

    return row ? mapAssociateProfile(row) : null;
  }

  async findByRg(rg: string): Promise<{ associateId: string } | null> {
    return findByNormalizedProfileIdentifier(this.database, {
      field: "rg",
      value: rg,
      normalizer: normalizeAssociateRg,
    });
  }

  async findByCnh(cnh: string): Promise<{ associateId: string } | null> {
    return findByNormalizedProfileIdentifier(this.database, {
      field: "cnh",
      value: cnh,
      normalizer: normalizeAssociateCnh,
    });
  }

  async findByCompanyCnpj(cnpj: string): Promise<{ associateId: string } | null> {
    return findByNormalizedProfileIdentifier(this.database, {
      field: "cnpj_empresa",
      value: cnpj,
      normalizer: normalizeAssociateCompanyCnpj,
    });
  }

  async upsertByAssociateId(
    associateId: string,
    data: AssociateProfileData,
  ): Promise<AssociateProfileData> {
    return this.database.write(async (session) => {
      const existing = await session.queryOne(
        "SELECT created_at FROM associate_profiles WHERE associate_id = ? LIMIT 1",
        [associateId],
      );
      const now = new Date().toISOString();
      const createdAt = existing ? String(existing[0]) : now;

      await session.execute(
        `
          INSERT INTO associate_profiles (
            associate_id,
            modalidade_associado,
            cnpj_empresa,
            nome_empresa,
            endereco_completo,
            bairro,
            cidade,
            estado,
            cep,
            profissao,
            sexo,
            data_nascimento,
            nacionalidade,
            naturalidade,
            rg,
            cnh,
            estado_civil,
            nome_pai,
            nome_mae,
            dependentes,
            grau_parentesco,
            telefone,
            celular,
            email,
            observacoes,
            situacao_financeira,
            situacao_documental,
            historico_resumo,
            foto_url,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(associate_id) DO UPDATE SET
            modalidade_associado = excluded.modalidade_associado,
            cnpj_empresa = excluded.cnpj_empresa,
            nome_empresa = excluded.nome_empresa,
            endereco_completo = excluded.endereco_completo,
            bairro = excluded.bairro,
            cidade = excluded.cidade,
            estado = excluded.estado,
            cep = excluded.cep,
            profissao = excluded.profissao,
            sexo = excluded.sexo,
            data_nascimento = excluded.data_nascimento,
            nacionalidade = excluded.nacionalidade,
            naturalidade = excluded.naturalidade,
            rg = excluded.rg,
            cnh = excluded.cnh,
            estado_civil = excluded.estado_civil,
            nome_pai = excluded.nome_pai,
            nome_mae = excluded.nome_mae,
            dependentes = excluded.dependentes,
            grau_parentesco = excluded.grau_parentesco,
            telefone = excluded.telefone,
            celular = excluded.celular,
            email = excluded.email,
            observacoes = excluded.observacoes,
            situacao_financeira = excluded.situacao_financeira,
            situacao_documental = excluded.situacao_documental,
            historico_resumo = excluded.historico_resumo,
            foto_url = excluded.foto_url,
            updated_at = excluded.updated_at
        `,
        [
          associateId,
          data.modalidadeAssociado,
          data.cnpjEmpresa,
          data.nomeEmpresa,
          data.enderecoCompleto,
          data.bairro,
          data.cidade,
          data.estado,
          data.cep,
          data.profissao,
          data.sexo,
          data.dataNascimento,
          data.nacionalidade,
          data.naturalidade,
          data.rg,
          data.cnh,
          data.estadoCivil,
          data.nomePai,
          data.nomeMae,
          data.dependentes,
          data.grauParentesco,
          data.telefone,
          data.celular,
          data.email,
          data.observacoes,
          data.situacaoFinanceira,
          data.situacaoDocumental,
          data.historicoResumo,
          data.fotoUrl,
          createdAt,
          now,
        ],
      );

      return data;
    });
  }

  async removeByAssociateId(associateId: string): Promise<void> {
    await this.database.write(async (session) => {
      await session.execute(
        "DELETE FROM associate_profiles WHERE associate_id = ?",
        [associateId],
      );
    });
  }
}

export function createEmptyAssociateProfile(): AssociateProfileData {
  return Object.fromEntries(
    profileFields.map((field) => [field, null]),
  ) as AssociateProfileData;
}

function mapAssociateProfile(row: DatabaseRow): AssociateProfileData {
  const record: AssociateProfileRecord = {
    associate_id: String(row[0]),
    modalidade_associado: normalizeNullable(row[1]),
    cnpj_empresa: normalizeNullable(row[2]),
    nome_empresa: normalizeNullable(row[3]),
    endereco_completo: normalizeNullable(row[4]),
    bairro: normalizeNullable(row[5]),
    cidade: normalizeNullable(row[6]),
    estado: normalizeNullable(row[7]),
    cep: normalizeNullable(row[8]),
    profissao: normalizeNullable(row[9]),
    sexo: normalizeNullable(row[10]),
    data_nascimento: normalizeNullable(row[11]),
    nacionalidade: normalizeNullable(row[12]),
    naturalidade: normalizeNullable(row[13]),
    rg: normalizeNullable(row[14]),
    cnh: normalizeNullable(row[15]),
    estado_civil: normalizeNullable(row[16]),
    nome_pai: normalizeNullable(row[17]),
    nome_mae: normalizeNullable(row[18]),
    dependentes: normalizeNullable(row[19]),
    grau_parentesco: normalizeNullable(row[20]),
    telefone: normalizeNullable(row[21]),
    celular: normalizeNullable(row[22]),
    email: normalizeNullable(row[23]),
    observacoes: normalizeNullable(row[24]),
    situacao_financeira: normalizeNullable(row[25]),
    situacao_documental: normalizeNullable(row[26]),
    historico_resumo: normalizeNullable(row[27]),
    foto_url: normalizeNullable(row[28]),
    created_at: String(row[29]),
    updated_at: String(row[30]),
  };

  return {
    modalidadeAssociado: normalizeProfileCategory(record.modalidade_associado),
    cnpjEmpresa: record.cnpj_empresa,
    nomeEmpresa: record.nome_empresa,
    enderecoCompleto: record.endereco_completo,
    bairro: record.bairro,
    cidade: record.cidade,
    estado: record.estado,
    cep: record.cep,
    profissao: record.profissao,
    sexo: (record.sexo as AssociateProfileData["sexo"]) ?? null,
    dataNascimento: record.data_nascimento,
    nacionalidade: record.nacionalidade,
    naturalidade: record.naturalidade,
    rg: record.rg,
    cnh: record.cnh,
    estadoCivil: record.estado_civil,
    nomePai: record.nome_pai,
    nomeMae: record.nome_mae,
    dependentes: record.dependentes,
    grauParentesco: record.grau_parentesco,
    telefone: record.telefone,
    celular: record.celular,
    email: record.email,
    observacoes: record.observacoes,
    situacaoFinanceira: record.situacao_financeira,
    situacaoDocumental: record.situacao_documental,
    historicoResumo: record.historico_resumo,
    fotoUrl: record.foto_url,
  };
}

function normalizeNullable(value: unknown) {
  return value == null ? null : String(value);
}

function normalizeProfileCategory(
  value: string | null,
): AssociateProfileData["modalidadeAssociado"] {
  if (!value) {
    return null;
  }

  const normalizedValue = value.trim().toUpperCase();

  if (normalizedValue === "TAXI" || normalizedValue === "TAXISTA") {
    return "TAXI";
  }

  if (normalizedValue === "CAMINHAO" || normalizedValue === "CAMINHÃO") {
    return "CAMINHAO";
  }

  if (
    normalizedValue === "ESCOLAR" ||
    normalizedValue === "TRANSPORTEESCOLAR" ||
    normalizedValue === "TRANSPORTE_ESCOLAR"
  ) {
    return "ESCOLAR";
  }

  if (normalizedValue === "CNPJ") {
    return "CNPJ";
  }

  return null;
}

async function findByNormalizedProfileIdentifier(
  database: DatabaseAdapter,
  options: {
    field: "rg" | "cnh" | "cnpj_empresa";
    value: string;
    normalizer: (value: unknown) => string | null;
  },
) {
  const normalizedTarget = options.normalizer(options.value);

  if (!normalizedTarget) {
    return null;
  }

  const rows = await database.query(
    `
      SELECT associate_id, ${options.field}
      FROM associate_profiles
      WHERE ${options.field} IS NOT NULL
        AND TRIM(${options.field}) <> ''
      ORDER BY associate_id ASC
    `,
  );

  for (const row of rows) {
    const normalizedValue = options.normalizer(row[1]);

    if (normalizedValue === normalizedTarget) {
      return {
        associateId: String(row[0]),
      };
    }
  }

  return null;
}

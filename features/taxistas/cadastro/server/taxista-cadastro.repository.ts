import type { DatabaseAdapter, DatabaseRow } from "@/lib/database/adapter";
import { getDatabaseAdapter } from "@/lib/database/provider";
import {
  createEmptyTaxistaCadastroProfile,
  type TaxistaAlvaraStatus,
  type TaxistaCadastroCounts,
  type TaxistaCadastroFilterMode,
  type TaxistaCadastroListFilters,
  type TaxistaCadastroListResult,
  type TaxistaCadastroProfile,
  type TaxistaCadastroRecord,
} from "@/features/taxistas/cadastro/types";

export interface TaxistaCadastroRepository {
  findMany(filters?: TaxistaCadastroListFilters): Promise<TaxistaCadastroListResult>;
  findByAssociateId(associateId: string): Promise<TaxistaCadastroRecord | null>;
  saveCadastro(
    associateId: string,
    input: {
      name: string;
      cpf: string;
      telefone: string | null;
      endereco: string | null;
      statusAlvara: TaxistaAlvaraStatus;
      selo: string | null;
      ponto: string | null;
      placa: string | null;
      modeloVeiculo: string | null;
      pressaoKgfM2: string | null;
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
      observacao: string | null;
    },
  ): Promise<void>;
  upsertProfile(
    associateId: string,
    profile: Omit<TaxistaCadastroProfile, "associateId" | "createdAt" | "updatedAt">,
  ): Promise<TaxistaCadastroProfile>;
  updateStatusAlvara(
    associateId: string,
    statusAlvara: TaxistaAlvaraStatus,
  ): Promise<void>;
  clearReadyStatuses(): Promise<void>;
}

export class SqliteTaxistaCadastroRepository
  implements TaxistaCadastroRepository
{
  constructor(private readonly database: DatabaseAdapter = getDatabaseAdapter()) {}

  async findMany(
    filters: TaxistaCadastroListFilters = {},
  ): Promise<TaxistaCadastroListResult> {
    const pageSize = normalizePageSize(filters.pageSize);
    const requestedPage = normalizePage(filters.page);
    const search = normalizeSearchTerm(filters.search);
    const mode = normalizeMode(filters.mode);
    const counts = await this.fetchCounts();
    const where = buildSearchWhereClause({ search, mode });
    const total =
      Number(
        await this.database.queryValue(
          `
            SELECT COUNT(*)
            FROM associates a
            INNER JOIN associate_profiles ap
              ON ap.associate_id = a.id
            LEFT JOIN taxista_profiles tp
              ON tp.associate_id = a.id
            WHERE ${where.sql}
          `,
          where.params,
        ),
      ) || 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(requestedPage, totalPages);
    const offset = (page - 1) * pageSize;
    const rows = await this.database.query(
      `
        ${buildSelectSql()}
        WHERE ${where.sql}
        ORDER BY a.name ASC
        LIMIT ? OFFSET ?
      `,
      [...where.params, pageSize, offset],
    );

    return {
      records: rows.map(mapTaxistaCadastroRecord),
      counts,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async findByAssociateId(associateId: string): Promise<TaxistaCadastroRecord | null> {
    const row = await this.database.queryOne(
      `
        ${buildSelectSql()}
        WHERE UPPER(COALESCE(ap.modalidade_associado, '')) = ?
          AND a.id = ?
        ORDER BY a.name ASC
      `,
      ["TAXI", associateId],
    );

    return row ? mapTaxistaCadastroRecord(row) : null;
  }

  async saveCadastro(
    associateId: string,
    input: {
      name: string;
      cpf: string;
      telefone: string | null;
      endereco: string | null;
      statusAlvara: TaxistaAlvaraStatus;
      selo: string | null;
      ponto: string | null;
      placa: string | null;
      modeloVeiculo: string | null;
      pressaoKgfM2: string | null;
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
      observacao: string | null;
    },
  ): Promise<void> {
    await this.database.write(async (session) => {
      const associate = await session.queryOne(
        `
          SELECT id
          FROM associates
          WHERE id = ?
          LIMIT 1
        `,
        [associateId],
      );

      if (!associate) {
        throw new Error("ASSOCIATE_NOT_FOUND");
      }

      const cpfConflict = await session.queryOne(
        `
          SELECT id
          FROM associates
          WHERE cpf = ?
            AND id <> ?
          LIMIT 1
        `,
        [input.cpf, associateId],
      );

      if (cpfConflict) {
        throw new Error("ASSOCIATE_CPF_ALREADY_EXISTS");
      }

      const profileMetadata = await session.queryOne(
        `
          SELECT created_at, modalidade_associado
          FROM associate_profiles
          WHERE associate_id = ?
          LIMIT 1
        `,
        [associateId],
      );
      const now = new Date().toISOString();
      const profileCreatedAt = profileMetadata ? String(profileMetadata[0]) : now;
      const modalidadeAssociado = profileMetadata?.[1]
        ? String(profileMetadata[1])
        : "TAXI";

      await session.execute(
        `
          UPDATE associates
          SET
            name = ?,
            cpf = ?,
            updated_at = ?
          WHERE id = ?
        `,
        [input.name, input.cpf, now, associateId],
      );

      await session.execute(
        `
          INSERT INTO associate_profiles (
            associate_id,
            modalidade_associado,
            endereco_completo,
            telefone,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(associate_id) DO UPDATE SET
            endereco_completo = excluded.endereco_completo,
            telefone = excluded.telefone,
            updated_at = excluded.updated_at
        `,
        [
          associateId,
          modalidadeAssociado,
          input.endereco,
          input.telefone,
          profileCreatedAt,
          now,
        ],
      );

      await session.execute(
        `
          INSERT INTO taxista_profiles (
            associate_id,
            status_alvara,
            selo,
            ponto,
            placa,
            modelo_veiculo,
            pressao_kgf_m2,
            numero_taximetro,
            modelo_taximetro,
            constante,
            inmetro,
            instalacao,
            troca_taximetro,
            pneu,
            deca,
            lacre_modulo,
            lacre_taxi,
            modulo,
            cinta,
            colocado,
            retirado,
            observacao,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(associate_id) DO UPDATE SET
            status_alvara = excluded.status_alvara,
            selo = excluded.selo,
            ponto = excluded.ponto,
            placa = excluded.placa,
            modelo_veiculo = excluded.modelo_veiculo,
            pressao_kgf_m2 = excluded.pressao_kgf_m2,
            numero_taximetro = excluded.numero_taximetro,
            modelo_taximetro = excluded.modelo_taximetro,
            constante = excluded.constante,
            inmetro = excluded.inmetro,
            instalacao = excluded.instalacao,
            troca_taximetro = excluded.troca_taximetro,
            pneu = excluded.pneu,
            deca = excluded.deca,
            lacre_modulo = excluded.lacre_modulo,
            lacre_taxi = excluded.lacre_taxi,
            modulo = excluded.modulo,
            cinta = excluded.cinta,
            colocado = excluded.colocado,
            retirado = excluded.retirado,
            observacao = excluded.observacao,
            updated_at = excluded.updated_at
        `,
        [
          associateId,
          input.statusAlvara,
          input.selo,
          input.ponto,
          input.placa,
          input.modeloVeiculo,
          input.pressaoKgfM2,
          input.numeroTaximetro,
          input.modeloTaximetro,
          input.constante,
          input.inmetro,
          input.instalacao,
          input.trocaTaximetro,
          input.pneu,
          input.deca,
          input.lacreModulo,
          input.lacreTaxi,
          input.modulo,
          input.cinta,
          input.colocado,
          input.retirado,
          input.observacao,
          now,
          now,
        ],
      );
    });
  }

  async upsertProfile(
    associateId: string,
    profile: Omit<TaxistaCadastroProfile, "associateId" | "createdAt" | "updatedAt">,
  ): Promise<TaxistaCadastroProfile> {
    return this.database.write(async (session) => {
      const existing = await session.queryOne(
        "SELECT created_at FROM taxista_profiles WHERE associate_id = ? LIMIT 1",
        [associateId],
      );
      const now = new Date().toISOString();
      const createdAt = existing ? String(existing[0]) : now;

      await session.execute(
        `
          INSERT INTO taxista_profiles (
            associate_id,
            status_alvara,
            selo,
            ponto,
            placa,
            modelo_veiculo,
            pressao_kgf_m2,
            numero_taximetro,
            modelo_taximetro,
            constante,
            inmetro,
            instalacao,
            troca_taximetro,
            pneu,
            deca,
            lacre_modulo,
            lacre_taxi,
            modulo,
            cinta,
            colocado,
            retirado,
            observacao,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(associate_id) DO UPDATE SET
            status_alvara = excluded.status_alvara,
            selo = excluded.selo,
            ponto = excluded.ponto,
            placa = excluded.placa,
            modelo_veiculo = excluded.modelo_veiculo,
            pressao_kgf_m2 = excluded.pressao_kgf_m2,
            numero_taximetro = excluded.numero_taximetro,
            modelo_taximetro = excluded.modelo_taximetro,
            constante = excluded.constante,
            inmetro = excluded.inmetro,
            instalacao = excluded.instalacao,
            troca_taximetro = excluded.troca_taximetro,
            pneu = excluded.pneu,
            deca = excluded.deca,
            lacre_modulo = excluded.lacre_modulo,
            lacre_taxi = excluded.lacre_taxi,
            modulo = excluded.modulo,
            cinta = excluded.cinta,
            colocado = excluded.colocado,
            retirado = excluded.retirado,
            observacao = excluded.observacao,
            updated_at = excluded.updated_at
        `,
        [
          associateId,
          profile.statusAlvara,
          profile.selo,
          profile.ponto,
          profile.placa,
          profile.modeloVeiculo,
          profile.pressaoKgfM2,
          profile.numeroTaximetro,
          profile.modeloTaximetro,
          profile.constante,
          profile.inmetro,
          profile.instalacao,
          profile.trocaTaximetro,
          profile.pneu,
          profile.deca,
          profile.lacreModulo,
          profile.lacreTaxi,
          profile.modulo,
          profile.cinta,
          profile.colocado,
          profile.retirado,
          profile.observacao,
          createdAt,
          now,
        ],
      );

      return {
        ...createEmptyTaxistaCadastroProfile(associateId),
        ...profile,
        associateId,
        createdAt,
        updatedAt: now,
      };
    });
  }

  async updateStatusAlvara(
    associateId: string,
    statusAlvara: TaxistaAlvaraStatus,
  ): Promise<void> {
    await this.database.write(async (session) => {
      const existing = await session.queryOne(
        "SELECT created_at FROM taxista_profiles WHERE associate_id = ? LIMIT 1",
        [associateId],
      );
      const now = new Date().toISOString();
      const createdAt = existing ? String(existing[0]) : now;

      await session.execute(
        `
          INSERT INTO taxista_profiles (
            associate_id,
            status_alvara,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?)
          ON CONFLICT(associate_id) DO UPDATE SET
            status_alvara = excluded.status_alvara,
            updated_at = excluded.updated_at
        `,
        [associateId, statusAlvara, createdAt, now],
      );
    });
  }

  async clearReadyStatuses(): Promise<void> {
    await this.database.write(async (session) => {
      await session.execute(
        `
          UPDATE taxista_profiles
          SET status_alvara = 'CADASTRO',
              updated_at = ?
          WHERE status_alvara = 'PRONTO'
        `,
        [new Date().toISOString()],
      );
    });
  }

  private async fetchCounts(): Promise<TaxistaCadastroCounts> {
    const baseSql = `
      FROM associates a
      INNER JOIN associate_profiles ap
        ON ap.associate_id = a.id
      LEFT JOIN taxista_profiles tp
        ON tp.associate_id = a.id
      WHERE UPPER(COALESCE(ap.modalidade_associado, '')) = ?
    `;

    const [all, protocolado, pronto] = await Promise.all([
      fetchCountValue(
        this.database,
        `SELECT COUNT(*) ${baseSql}`,
        ["TAXI"],
      ),
      fetchCountValue(
        this.database,
        `SELECT COUNT(*) ${baseSql} AND COALESCE(tp.status_alvara, 'CADASTRO') = ?`,
        ["TAXI", "PROTOCOLADO"],
      ),
      fetchCountValue(
        this.database,
        `SELECT COUNT(*) ${baseSql} AND COALESCE(tp.status_alvara, 'CADASTRO') = ?`,
        ["TAXI", "PRONTO"],
      ),
    ]);

    return {
      all,
      protocolado,
      pronto,
    };
  }
}

type SearchWhereClause = {
  sql: string;
  params: unknown[];
};

type SearchPattern =
  | {
      kind: "cpf_exact";
      digits: string;
    }
  | {
      kind: "plate_exact";
      code: string;
      exactCandidates: string[];
    }
  | {
      kind: "code_prefix";
      code: string;
      rawUpper: string;
    }
  | {
      kind: "text";
      text: string;
    }
  | {
      kind: "broad";
      text: string | null;
      digits: string | null;
      code: string | null;
    };

async function fetchCountValue(
  database: DatabaseAdapter,
  sql: string,
  params: unknown[],
) {
  return Number(await database.queryValue(sql, params)) || 0;
}

function buildSearchWhereClause({
  search,
  mode,
}: {
  search: string | null;
  mode: TaxistaCadastroFilterMode;
}): SearchWhereClause {
  const params: unknown[] = ["TAXI"];
  const conditions = ["UPPER(COALESCE(ap.modalidade_associado, '')) = ?"];

  if (mode !== "ALL") {
    conditions.push("COALESCE(tp.status_alvara, 'CADASTRO') = ?");
    params.push(mode);
  }

  if (search) {
    const pattern = classifySearchPattern(search);
    const searchConditions: string[] = [];

    switch (pattern.kind) {
      case "cpf_exact":
        searchConditions.push("a.cpf = ?");
        params.push(pattern.digits);
        break;
      case "plate_exact": {
        const exactConditions = pattern.exactCandidates.map(() => "tp.placa = ?");
        searchConditions.push(
          `(${[...exactConditions, `${buildCodeExpression("tp.placa")} = ?`].join(" OR ")})`,
        );
        params.push(...pattern.exactCandidates, pattern.code);
        break;
      }
      case "code_prefix":
        searchConditions.push("tp.selo = ?");
        params.push(pattern.rawUpper);
        searchConditions.push(`${buildCodeExpression("tp.selo")} LIKE ?`);
        params.push(`${pattern.code}%`);
        searchConditions.push(`${buildCodeExpression("tp.placa")} LIKE ?`);
        params.push(`${pattern.code}%`);
        break;
      case "text":
        searchConditions.push(`${buildNormalizedNameExpression("a.name")} LIKE ?`);
        params.push(`%${pattern.text}%`);
        break;
      case "broad":
        if (pattern.text) {
          searchConditions.push(`${buildNormalizedNameExpression("a.name")} LIKE ?`);
          params.push(`%${pattern.text}%`);
        }

        if (pattern.digits) {
          searchConditions.push(`${buildDigitsExpression("a.cpf")} LIKE ?`);
          params.push(`%${pattern.digits}%`);
        }

        if (pattern.code) {
          searchConditions.push(`${buildCodeExpression("tp.selo")} LIKE ?`);
          params.push(`${pattern.code}%`);
          searchConditions.push(`${buildCodeExpression("tp.placa")} LIKE ?`);
          params.push(`${pattern.code}%`);
        }
        break;
    }

    if (searchConditions.length > 0) {
      conditions.push(`(${searchConditions.join(" OR ")})`);
    }
  }

  return {
    sql: conditions.join(" AND "),
    params,
  };
}

function buildNormalizedNameExpression(column: string) {
  let expression = `LOWER(COALESCE(${column}, ''))`;
  const replacements: Array<[string, string]> = [
    ["\u00E1", "a"],
    ["\u00E0", "a"],
    ["\u00E3", "a"],
    ["\u00E2", "a"],
    ["\u00E4", "a"],
    ["\u00E9", "e"],
    ["\u00E8", "e"],
    ["\u00EA", "e"],
    ["\u00EB", "e"],
    ["\u00ED", "i"],
    ["\u00EC", "i"],
    ["\u00EE", "i"],
    ["\u00EF", "i"],
    ["\u00F3", "o"],
    ["\u00F2", "o"],
    ["\u00F5", "o"],
    ["\u00F4", "o"],
    ["\u00F6", "o"],
    ["\u00FA", "u"],
    ["\u00F9", "u"],
    ["\u00FB", "u"],
    ["\u00FC", "u"],
    ["\u00E7", "c"],
  ];

  for (const [target, replacement] of replacements) {
    expression = `REPLACE(${expression}, '${target}', '${replacement}')`;
  }

  return expression;
}

function buildDigitsExpression(column: string) {
  let expression = `COALESCE(${column}, '')`;

  for (const token of [".", "-", "/", " ", "(", ")"]) {
    expression = `REPLACE(${expression}, '${token}', '')`;
  }

  return expression;
}

function buildCodeExpression(column: string) {
  let expression = `UPPER(COALESCE(${column}, ''))`;

  for (const token of ["-", ".", "/", " ", "_"]) {
    expression = `REPLACE(${expression}, '${token}', '')`;
  }

  return expression;
}

function normalizeSearchTerm(value: string | undefined) {
  const normalized = value?.trim() ?? "";
  return normalized ? normalized : null;
}

function classifySearchPattern(search: string): SearchPattern {
  const normalizedText = normalizeComparableText(search);
  const digits = normalizeDigits(search);
  const code = normalizeCode(search);
  const rawUpper = search.trim().toUpperCase();

  if (digits && digits.length === 11 && !/[A-Za-z]/.test(search)) {
    return {
      kind: "cpf_exact",
      digits,
    };
  }

  if (code && isLikelyPlateCode(code)) {
    return {
      kind: "plate_exact",
      code,
      exactCandidates: buildPlateExactCandidates(search, code),
    };
  }

  if (code && isLikelyCodeSearch(search, code)) {
    return {
      kind: "code_prefix",
      code,
      rawUpper,
    };
  }

  if (normalizedText) {
    return {
      kind: "text",
      text: normalizedText,
    };
  }

  return {
    kind: "broad",
    text: normalizedText,
    digits,
    code,
  };
}

function normalizeComparableText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, "")
    .toLowerCase()
    .trim();
}

function normalizeDigits(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? digits : null;
}

function normalizeCode(value: string) {
  const normalized = value.replace(/[^\p{L}\p{N}]+/gu, "").toUpperCase().trim();
  return normalized ? normalized : null;
}

function isLikelyPlateCode(code: string) {
  return /^[A-Z]{3}\d{4}$/.test(code) || /^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(code);
}

function isLikelyCodeSearch(raw: string, code: string) {
  return /[A-Za-z]/.test(raw) && /\d/.test(code);
}

function buildPlateExactCandidates(raw: string, code: string) {
  const candidates = new Set<string>();
  const trimmedRaw = raw.trim();

  if (trimmedRaw) {
    candidates.add(trimmedRaw);
    candidates.add(trimmedRaw.toUpperCase());
  }

  if (code.length === 7) {
    candidates.add(`${code.slice(0, 3)}-${code.slice(3)}`);
  }

  return [...candidates];
}

function normalizeMode(value: TaxistaCadastroFilterMode | undefined): TaxistaCadastroFilterMode {
  if (value === "PROTOCOLADO" || value === "PRONTO") {
    return value;
  }

  return "ALL";
}

function normalizePage(value: number | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 1;
  }

  return Math.max(1, Math.floor(value));
}

function normalizePageSize(value: number | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 25;
  }

  return Math.max(1, Math.min(100, Math.floor(value)));
}

function buildSelectSql() {
  return `
    SELECT
      a.id,
      a.name,
      a.cpf,
      COALESCE(ap.telefone, ap.celular),
      ap.endereco_completo,
      a.registration_number,
      a.status,
      COALESCE(tp.status_alvara, 'CADASTRO'),
      tp.selo,
      tp.ponto,
      tp.placa,
      tp.modelo_veiculo,
      tp.pressao_kgf_m2,
      tp.numero_taximetro,
      tp.modelo_taximetro,
      tp.constante,
      tp.inmetro,
      tp.instalacao,
      tp.troca_taximetro,
      tp.pneu,
      tp.deca,
      tp.lacre_modulo,
      tp.lacre_taxi,
      tp.modulo,
      tp.cinta,
      tp.colocado,
      tp.retirado,
      tp.observacao
    FROM associates a
    INNER JOIN associate_profiles ap
      ON ap.associate_id = a.id
    LEFT JOIN taxista_profiles tp
      ON tp.associate_id = a.id
  `;
}

function mapTaxistaCadastroRecord(row: DatabaseRow): TaxistaCadastroRecord {
  return {
    associateId: String(row[0]),
    name: String(row[1]),
    cpf: String(row[2]),
    telefone: normalizeNullable(row[3]),
    endereco: normalizeNullable(row[4]),
    registrationNumber: String(row[5]),
    status: String(row[6]) as TaxistaCadastroRecord["status"],
    statusAlvara: String(row[7]) as TaxistaCadastroRecord["statusAlvara"],
    selo: normalizeNullable(row[8]),
    ponto: normalizeNullable(row[9]),
    placa: normalizeNullable(row[10]),
    modeloVeiculo: normalizeNullable(row[11]),
    pressaoKgfM2: normalizeNullable(row[12]),
    numeroTaximetro: normalizeNullable(row[13]),
    modeloTaximetro: normalizeNullable(row[14]),
    constante: normalizeNullable(row[15]),
    inmetro: normalizeNullable(row[16]),
    instalacao: normalizeNullable(row[17]),
    trocaTaximetro: normalizeNullable(row[18]),
    pneu: normalizeNullable(row[19]),
    deca: normalizeNullable(row[20]),
    lacreModulo: normalizeNullable(row[21]),
    lacreTaxi: normalizeNullable(row[22]),
    modulo: normalizeNullable(row[23]),
    cinta: normalizeNullable(row[24]),
    colocado: normalizeNullable(row[25]),
    retirado: normalizeNullable(row[26]),
    observacao: normalizeNullable(row[27]),
  };
}

function normalizeNullable(value: unknown) {
  if (value == null) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized ? normalized : null;
}

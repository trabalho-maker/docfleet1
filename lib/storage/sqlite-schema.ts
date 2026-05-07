import type { SqliteDatabaseConnection as Database } from "@/lib/storage/sqlite-connection";
import {
  normalizeAssociateCnh,
  normalizeAssociateCompanyCnpj,
  normalizeAssociateRg,
} from "@/features/associates/lib/associate-profile-identifiers";

const SCHEMA_VERSION_TABLE = "app_schema_version";
const CURRENT_SQLITE_SCHEMA_VERSION = 2;

function tableExists(db: Database, tableName: string) {
  const result = db.exec(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
    [tableName],
  )[0]?.values;

  return (result?.length ?? 0) > 0;
}

function hasColumn(db: Database, tableName: string, columnName: string) {
  const columns = db.exec(`PRAGMA table_info(${tableName})`)[0]?.values ?? [];
  return columns.some((column) => String(column[1]) === columnName);
}

function ensureColumnExists(
  db: Database,
  tableName: string,
  columnName: string,
  definition: string,
) {
  if (!hasColumn(db, tableName, columnName)) {
    db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

function dropIndexIfExists(db: Database, indexName: string) {
  db.run(`DROP INDEX IF EXISTS ${indexName}`);
}

function dropLegacyRebuildTableIfExists(db: Database, tableName: string) {
  db.run(`DROP TABLE IF EXISTS ${tableName}__old`);
}

function trimmedColumnOrNull(db: Database, tableName: string, columnName: string) {
  return hasColumn(db, tableName, columnName)
    ? `NULLIF(TRIM(${columnName}), '')`
    : "NULL";
}

function normalizedIdentifierSql(columnName: string, uppercase = false) {
  const strippedExpression = [
    ".",
    "-",
    "/",
    " ",
    "(",
    ")",
  ].reduce(
    (expression, token) => `REPLACE(${expression}, '${token}', '')`,
    `TRIM(${columnName})`,
  );

  return uppercase ? `UPPER(${strippedExpression})` : strippedExpression;
}

function normalizedAssociateProfileRgSql(columnName: string) {
  return normalizedIdentifierSql(columnName, true);
}

function normalizedAssociateProfileDigitsSql(columnName: string) {
  return normalizedIdentifierSql(columnName);
}

function getDuplicateNormalizedAssociateProfileValue(
  db: Database,
  options: {
    columnName: "rg" | "cnh" | "cnpj_empresa";
    normalizedExpression: string;
  },
) {
  const row = db.exec(
    `
      SELECT ${options.normalizedExpression} AS normalized_value, COUNT(*) AS duplicate_count
      FROM associate_profiles
      WHERE ${options.columnName} IS NOT NULL
        AND TRIM(${options.columnName}) <> ''
      GROUP BY ${options.normalizedExpression}
      HAVING normalized_value <> ''
        AND duplicate_count > 1
      LIMIT 1
    `,
  )[0]?.values?.[0];

  return row ? String(row[0]) : null;
}

function validateAssociateProfileIdentifierUniqueness(db: Database) {
  const duplicateRg = getDuplicateNormalizedAssociateProfileValue(db, {
    columnName: "rg",
    normalizedExpression: normalizedAssociateProfileRgSql("rg"),
  });

  if (duplicateRg) {
    throw new Error(`SQLITE_ASSOCIATE_PROFILE_RG_DUPLICATE:${duplicateRg}`);
  }

  const duplicateCnh = getDuplicateNormalizedAssociateProfileValue(db, {
    columnName: "cnh",
    normalizedExpression: normalizedAssociateProfileDigitsSql("cnh"),
  });

  if (duplicateCnh) {
    throw new Error(`SQLITE_ASSOCIATE_PROFILE_CNH_DUPLICATE:${duplicateCnh}`);
  }

  const duplicateCompanyCnpj = getDuplicateNormalizedAssociateProfileValue(db, {
    columnName: "cnpj_empresa",
    normalizedExpression: normalizedAssociateProfileDigitsSql("cnpj_empresa"),
  });

  if (duplicateCompanyCnpj) {
    throw new Error(
      `SQLITE_ASSOCIATE_PROFILE_CNPJ_EMPRESA_DUPLICATE:${duplicateCompanyCnpj}`,
    );
  }
}

function dropAssociateProfileUniqueIndexes(db: Database) {
  dropIndexIfExists(db, "idx_associate_profiles_rg_unique_non_empty");
  dropIndexIfExists(db, "idx_associate_profiles_cnh_unique_non_empty");
  dropIndexIfExists(db, "idx_associate_profiles_cnpj_empresa_unique_non_empty");
}

function createSchemaVersionTable(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS ${SCHEMA_VERSION_TABLE} (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      version INTEGER NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
}

function getRecordedSchemaVersion(db: Database) {
  const value = db.exec(
    `SELECT version FROM ${SCHEMA_VERSION_TABLE} WHERE id = 1 LIMIT 1`,
  )[0]?.values?.[0]?.[0];

  return value == null ? null : Number(value);
}

function setRecordedSchemaVersion(db: Database, version: number) {
  const now = new Date().toISOString();

  db.run(
    `
      INSERT INTO ${SCHEMA_VERSION_TABLE} (id, version, updated_at)
      VALUES (1, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        version = excluded.version,
        updated_at = excluded.updated_at
    `,
    [version, now],
  );
}

function hasLegacySchemaWithoutVersion(db: Database) {
  const rows = db.exec(
    `
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
        AND name NOT LIKE 'sqlite_%'
        AND name <> ?
      LIMIT 1
    `,
    [SCHEMA_VERSION_TABLE],
  )[0]?.values;

  return (rows?.length ?? 0) > 0;
}

function createCoreTables(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      password_hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS associates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      cpf TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      registration_number TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL,
      admission_date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      owner TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      due_date TEXT NOT NULL,
      associate_id TEXT,
      notes TEXT,
      FOREIGN KEY (associate_id) REFERENCES associates(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      severity TEXT NOT NULL,
      team TEXT NOT NULL,
      created_at TEXT NOT NULL,
      kind TEXT,
      source_document_id TEXT UNIQUE,
      FOREIGN KEY (source_document_id) REFERENCES documents(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      consumed_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS auth_rate_limits (
      scope TEXT NOT NULL,
      identifier TEXT NOT NULL,
      attempts INTEGER NOT NULL,
      window_started_at TEXT NOT NULL,
      blocked_until TEXT,
      penalty_level INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (scope, identifier)
    );

    CREATE TABLE IF NOT EXISTS associate_operation_profiles (
      associate_id TEXT PRIMARY KEY,
      operation_type TEXT NOT NULL,
      basic_documentation_due_date TEXT,
      vehicle_authorization_due_date TEXT,
      driver_authorization_due_date TEXT,
      cargo_licensing_due_date TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (associate_id) REFERENCES associates(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS associate_profiles (
      associate_id TEXT PRIMARY KEY,
      modalidade_associado TEXT,
      cnpj_empresa TEXT,
      nome_empresa TEXT,
      endereco_completo TEXT,
      bairro TEXT,
      cidade TEXT,
      estado TEXT,
      cep TEXT,
      profissao TEXT,
      sexo TEXT,
      data_nascimento TEXT,
      nacionalidade TEXT,
      naturalidade TEXT,
      rg TEXT,
      cnh TEXT,
      estado_civil TEXT,
      nome_pai TEXT,
      nome_mae TEXT,
      dependentes TEXT,
      grau_parentesco TEXT,
      telefone TEXT,
      celular TEXT,
      email TEXT,
      observacoes TEXT,
      situacao_financeira TEXT,
      situacao_documental TEXT,
      historico_resumo TEXT,
      foto_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (associate_id) REFERENCES associates(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS membership_fee_sheets (
      id TEXT PRIMARY KEY,
      associate_id TEXT NOT NULL,
      reference_year INTEGER NOT NULL,
      status TEXT NOT NULL,
      snapshot_name TEXT,
      snapshot_address TEXT,
      snapshot_category TEXT,
      snapshot_phone TEXT,
      snapshot_registration_suffix TEXT,
      snapshot_inss TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (associate_id) REFERENCES associates(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS membership_fee_payments (
      id TEXT PRIMARY KEY,
      sheet_id TEXT NOT NULL,
      associate_id TEXT NOT NULL,
      competence_year INTEGER NOT NULL,
      competence_month INTEGER NOT NULL CHECK (competence_month BETWEEN 1 AND 12),
      paid_at TEXT NOT NULL,
      paid_by_user_id TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (sheet_id) REFERENCES membership_fee_sheets(id) ON DELETE CASCADE,
      FOREIGN KEY (associate_id) REFERENCES associates(id) ON DELETE CASCADE,
      FOREIGN KEY (paid_by_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS taxista_profiles (
      associate_id TEXT PRIMARY KEY,
      status_alvara TEXT NOT NULL DEFAULT 'CADASTRO',
      selo TEXT,
      ponto TEXT,
      placa TEXT,
      modelo_veiculo TEXT,
      pressao_kgf_m2 TEXT,
      numero_taximetro TEXT,
      modelo_taximetro TEXT,
      constante TEXT,
      inmetro TEXT,
      instalacao TEXT,
      troca_taximetro TEXT,
      pneu TEXT,
      deca TEXT,
      lacre_modulo TEXT,
      lacre_taxi TEXT,
      modulo TEXT,
      cinta TEXT,
      colocado TEXT,
      retirado TEXT,
      observacao TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (associate_id) REFERENCES associates(id) ON DELETE CASCADE
    );
  `);
}

function createIndexes(db: Database) {
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_documents_due_date
    ON documents(due_date);

    CREATE INDEX IF NOT EXISTS idx_documents_status
    ON documents(status);

    CREATE INDEX IF NOT EXISTS idx_documents_associate_id
    ON documents(associate_id);

    CREATE INDEX IF NOT EXISTS idx_documents_type_due_date
    ON documents(type, due_date);

    CREATE UNIQUE INDEX IF NOT EXISTS idx_documents_associate_type_unique
    ON documents(associate_id, type)
    WHERE associate_id IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_alerts_created_at
    ON alerts(created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_alerts_kind
    ON alerts(kind);

    CREATE INDEX IF NOT EXISTS idx_alerts_kind_created_at
    ON alerts(kind, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_alerts_source_document_id
    ON alerts(source_document_id);

    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id
    ON password_reset_tokens(user_id);

    CREATE INDEX IF NOT EXISTS idx_associates_name
    ON associates(name);

    CREATE INDEX IF NOT EXISTS idx_associates_category
    ON associates(category);

    CREATE INDEX IF NOT EXISTS idx_associates_status
    ON associates(status);

    CREATE INDEX IF NOT EXISTS idx_associates_admission_date
    ON associates(admission_date);

    CREATE INDEX IF NOT EXISTS idx_associate_operation_profiles_type
    ON associate_operation_profiles(operation_type);

    CREATE INDEX IF NOT EXISTS idx_associate_operation_profiles_type_associate_id
    ON associate_operation_profiles(operation_type, associate_id);

    CREATE INDEX IF NOT EXISTS idx_associate_profiles_email
    ON associate_profiles(email);

    CREATE INDEX IF NOT EXISTS idx_associate_profiles_modalidade_associado
    ON associate_profiles(modalidade_associado);

    CREATE UNIQUE INDEX IF NOT EXISTS idx_associate_profiles_rg_unique_non_empty
    ON associate_profiles(${normalizedAssociateProfileRgSql("rg")})
    WHERE rg IS NOT NULL
      AND TRIM(rg) <> ''
      AND ${normalizedAssociateProfileRgSql("rg")} <> '';

    CREATE UNIQUE INDEX IF NOT EXISTS idx_associate_profiles_cnh_unique_non_empty
    ON associate_profiles(${normalizedAssociateProfileDigitsSql("cnh")})
    WHERE cnh IS NOT NULL
      AND TRIM(cnh) <> ''
      AND ${normalizedAssociateProfileDigitsSql("cnh")} <> '';

    CREATE UNIQUE INDEX IF NOT EXISTS idx_associate_profiles_cnpj_empresa_unique_non_empty
    ON associate_profiles(${normalizedAssociateProfileDigitsSql("cnpj_empresa")})
    WHERE cnpj_empresa IS NOT NULL
      AND TRIM(cnpj_empresa) <> ''
      AND ${normalizedAssociateProfileDigitsSql("cnpj_empresa")} <> '';

    CREATE UNIQUE INDEX IF NOT EXISTS idx_membership_fee_sheets_associate_year_unique
    ON membership_fee_sheets(associate_id, reference_year);

    CREATE UNIQUE INDEX IF NOT EXISTS idx_membership_fee_sheets_associate_active_unique
    ON membership_fee_sheets(associate_id)
    WHERE status = 'active';

    CREATE INDEX IF NOT EXISTS idx_membership_fee_sheets_status_year
    ON membership_fee_sheets(status, reference_year);

    CREATE INDEX IF NOT EXISTS idx_membership_fee_sheets_associate_year
    ON membership_fee_sheets(associate_id, reference_year);

    CREATE UNIQUE INDEX IF NOT EXISTS idx_membership_fee_payments_associate_competence_unique
    ON membership_fee_payments(associate_id, competence_year, competence_month);

    CREATE INDEX IF NOT EXISTS idx_membership_fee_payments_associate_year
    ON membership_fee_payments(associate_id, competence_year);

    CREATE INDEX IF NOT EXISTS idx_membership_fee_payments_competence
    ON membership_fee_payments(competence_year, competence_month);

    CREATE INDEX IF NOT EXISTS idx_membership_fee_payments_sheet_id
    ON membership_fee_payments(sheet_id);

    CREATE INDEX IF NOT EXISTS idx_taxista_profiles_placa
    ON taxista_profiles(placa);
  `);
}

function deduplicateAssociateDocuments(db: Database) {
  db.run(`
    WITH ranked_documents AS (
      SELECT
        rowid,
        ROW_NUMBER() OVER (
          PARTITION BY associate_id, type
          ORDER BY
            CASE WHEN TRIM(COALESCE(notes, '')) <> '' THEN 1 ELSE 0 END DESC,
            due_date DESC,
            rowid DESC
        ) AS duplicate_rank
      FROM documents
      WHERE associate_id IS NOT NULL
    )
    DELETE FROM documents
    WHERE rowid IN (
      SELECT rowid
      FROM ranked_documents
      WHERE duplicate_rank > 1
    )
  `);
}

function rebuildDocumentsTable(db: Database) {
  if (!tableExists(db, "documents")) {
    return;
  }

  dropLegacyRebuildTableIfExists(db, "documents");
  dropIndexIfExists(db, "idx_documents_due_date");
  dropIndexIfExists(db, "idx_documents_status");
  dropIndexIfExists(db, "idx_documents_associate_id");
  dropIndexIfExists(db, "idx_documents_type_due_date");
  dropIndexIfExists(db, "idx_documents_associate_type_unique");

  const nameExpression = trimmedColumnOrNull(db, "documents", "name");
  const titleExpression = trimmedColumnOrNull(db, "documents", "title");
  const typeExpression = trimmedColumnOrNull(db, "documents", "type");
  const legacyCategoryExpression = trimmedColumnOrNull(db, "documents", "category");
  const notesExpression = hasColumn(db, "documents", "notes") ? "notes" : "NULL";
  const associateIdExpression = hasColumn(db, "documents", "associate_id")
    ? `CASE
         WHEN associate_id IS NULL THEN NULL
         WHEN EXISTS (SELECT 1 FROM associates WHERE id = associate_id) THEN associate_id
         ELSE NULL
       END`
    : "NULL";

  db.run("ALTER TABLE documents RENAME TO documents__old");
  db.run(`
    CREATE TABLE documents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      owner TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      due_date TEXT NOT NULL,
      associate_id TEXT,
      notes TEXT,
      FOREIGN KEY (associate_id) REFERENCES associates(id) ON DELETE CASCADE
    )
  `);
  db.run(`
    INSERT INTO documents (
      id,
      name,
      owner,
      type,
      status,
      due_date,
      associate_id,
      notes
    )
    SELECT
      id,
      COALESCE(
        ${nameExpression},
        ${titleExpression},
        ${typeExpression},
        ${legacyCategoryExpression},
        'Documento'
      ),
      owner,
      COALESCE(${typeExpression}, ${legacyCategoryExpression}, 'OUTRO'),
      status,
      due_date,
      ${associateIdExpression},
      ${notesExpression}
    FROM documents__old
  `);
  deduplicateAssociateDocuments(db);
  db.run("DROP TABLE documents__old");
}

function rebuildAlertsTable(db: Database) {
  if (!tableExists(db, "alerts")) {
    return;
  }

  dropLegacyRebuildTableIfExists(db, "alerts");
  dropIndexIfExists(db, "idx_alerts_created_at");
  dropIndexIfExists(db, "idx_alerts_kind");
  dropIndexIfExists(db, "idx_alerts_kind_created_at");
  dropIndexIfExists(db, "idx_alerts_source_document_id");

  const kindExpression = trimmedColumnOrNull(db, "alerts", "kind");
  const hasSourceDocumentId = hasColumn(db, "alerts", "source_document_id");
  const sourceDocumentExpression = hasSourceDocumentId
    ? "NULLIF(TRIM(source_document_id), '')"
    : "NULL";

  db.run("ALTER TABLE alerts RENAME TO alerts__old");
  db.run(`
    CREATE TABLE alerts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      severity TEXT NOT NULL,
      team TEXT NOT NULL,
      created_at TEXT NOT NULL,
      kind TEXT,
      source_document_id TEXT UNIQUE,
      FOREIGN KEY (source_document_id) REFERENCES documents(id) ON DELETE CASCADE
    )
  `);
  db.run(`
    INSERT INTO alerts (
      id,
      title,
      severity,
      team,
      created_at,
      kind,
      source_document_id
    )
    SELECT
      id,
      title,
      severity,
      team,
      created_at,
      COALESCE(${kindExpression}, 'manual'),
      NULL
    FROM alerts__old
    WHERE ${sourceDocumentExpression} IS NULL
  `);

  if (hasSourceDocumentId) {
    db.run(`
      WITH ranked_alerts AS (
        SELECT
          id,
          title,
          severity,
          team,
          created_at,
          COALESCE(${kindExpression}, 'manual') AS normalized_kind,
          ${sourceDocumentExpression} AS normalized_source_document_id,
          ROW_NUMBER() OVER (
            PARTITION BY ${sourceDocumentExpression}
            ORDER BY
              CASE WHEN COALESCE(${kindExpression}, 'manual') = 'document_expiration' THEN 1 ELSE 0 END DESC,
              created_at DESC,
              rowid DESC
          ) AS duplicate_rank
        FROM alerts__old
        WHERE ${sourceDocumentExpression} IS NOT NULL
      )
      INSERT INTO alerts (
        id,
        title,
        severity,
        team,
        created_at,
        kind,
        source_document_id
      )
      SELECT
        ranked_alerts.id,
        ranked_alerts.title,
        ranked_alerts.severity,
        ranked_alerts.team,
        ranked_alerts.created_at,
        ranked_alerts.normalized_kind,
        ranked_alerts.normalized_source_document_id
      FROM ranked_alerts
      INNER JOIN documents
        ON documents.id = ranked_alerts.normalized_source_document_id
      WHERE ranked_alerts.duplicate_rank = 1
    `);
  }

  db.run("DROP TABLE alerts__old");
}

function rebuildPasswordResetTokensTable(db: Database) {
  if (!tableExists(db, "password_reset_tokens")) {
    return;
  }

  dropLegacyRebuildTableIfExists(db, "password_reset_tokens");
  dropIndexIfExists(db, "idx_password_reset_tokens_user_id");

  db.run("ALTER TABLE password_reset_tokens RENAME TO password_reset_tokens__old");
  db.run(`
    CREATE TABLE password_reset_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      consumed_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  db.run(`
    INSERT INTO password_reset_tokens (
      id,
      user_id,
      token_hash,
      expires_at,
      created_at,
      consumed_at
    )
    SELECT
      prt.id,
      prt.user_id,
      prt.token_hash,
      prt.expires_at,
      prt.created_at,
      prt.consumed_at
    FROM password_reset_tokens__old prt
    INNER JOIN users
      ON users.id = prt.user_id
  `);
  db.run("DROP TABLE password_reset_tokens__old");
}

function rebuildAssociateOperationProfilesTable(db: Database) {
  if (!tableExists(db, "associate_operation_profiles")) {
    return;
  }

  dropLegacyRebuildTableIfExists(db, "associate_operation_profiles");
  dropIndexIfExists(db, "idx_associate_operation_profiles_type");
  dropIndexIfExists(db, "idx_associate_operation_profiles_type_associate_id");

  db.run("ALTER TABLE associate_operation_profiles RENAME TO associate_operation_profiles__old");
  db.run(`
    CREATE TABLE associate_operation_profiles (
      associate_id TEXT PRIMARY KEY,
      operation_type TEXT NOT NULL,
      basic_documentation_due_date TEXT,
      vehicle_authorization_due_date TEXT,
      driver_authorization_due_date TEXT,
      cargo_licensing_due_date TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (associate_id) REFERENCES associates(id) ON DELETE CASCADE
    )
  `);
  db.run(`
    INSERT INTO associate_operation_profiles (
      associate_id,
      operation_type,
      basic_documentation_due_date,
      vehicle_authorization_due_date,
      driver_authorization_due_date,
      cargo_licensing_due_date,
      created_at,
      updated_at
    )
    SELECT
      old.associate_id,
      old.operation_type,
      old.basic_documentation_due_date,
      old.vehicle_authorization_due_date,
      old.driver_authorization_due_date,
      old.cargo_licensing_due_date,
      old.created_at,
      old.updated_at
    FROM associate_operation_profiles__old old
    INNER JOIN associates
      ON associates.id = old.associate_id
  `);
  db.run("DROP TABLE associate_operation_profiles__old");
}

function rebuildAssociateProfilesTable(db: Database) {
  if (!tableExists(db, "associate_profiles")) {
    return;
  }

  dropLegacyRebuildTableIfExists(db, "associate_profiles");
  dropIndexIfExists(db, "idx_associate_profiles_email");
  dropIndexIfExists(db, "idx_associate_profiles_modalidade_associado");
  dropAssociateProfileUniqueIndexes(db);

  db.run("ALTER TABLE associate_profiles RENAME TO associate_profiles__old");
  db.run(`
    CREATE TABLE associate_profiles (
      associate_id TEXT PRIMARY KEY,
      modalidade_associado TEXT,
      cnpj_empresa TEXT,
      nome_empresa TEXT,
      endereco_completo TEXT,
      bairro TEXT,
      cidade TEXT,
      estado TEXT,
      cep TEXT,
      profissao TEXT,
      sexo TEXT,
      data_nascimento TEXT,
      nacionalidade TEXT,
      naturalidade TEXT,
      rg TEXT,
      cnh TEXT,
      estado_civil TEXT,
      nome_pai TEXT,
      nome_mae TEXT,
      dependentes TEXT,
      grau_parentesco TEXT,
      telefone TEXT,
      celular TEXT,
      email TEXT,
      observacoes TEXT,
      situacao_financeira TEXT,
      situacao_documental TEXT,
      historico_resumo TEXT,
      foto_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (associate_id) REFERENCES associates(id) ON DELETE CASCADE
    )
  `);
  db.run(`
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
    )
    SELECT
      old.associate_id,
      ${trimmedColumnOrNull(db, "associate_profiles", "modalidade_associado")},
      ${hasColumn(db, "associate_profiles", "cnpj_empresa") ? "cnpj_empresa" : "NULL"},
      ${hasColumn(db, "associate_profiles", "nome_empresa") ? "nome_empresa" : "NULL"},
      ${hasColumn(db, "associate_profiles", "endereco_completo") ? "endereco_completo" : "NULL"},
      ${hasColumn(db, "associate_profiles", "bairro") ? "bairro" : "NULL"},
      ${hasColumn(db, "associate_profiles", "cidade") ? "cidade" : "NULL"},
      ${hasColumn(db, "associate_profiles", "estado") ? "estado" : "NULL"},
      ${hasColumn(db, "associate_profiles", "cep") ? "cep" : "NULL"},
      ${hasColumn(db, "associate_profiles", "profissao") ? "profissao" : "NULL"},
      ${hasColumn(db, "associate_profiles", "sexo") ? "sexo" : "NULL"},
      ${hasColumn(db, "associate_profiles", "data_nascimento") ? "data_nascimento" : "NULL"},
      ${hasColumn(db, "associate_profiles", "nacionalidade") ? "nacionalidade" : "NULL"},
      ${hasColumn(db, "associate_profiles", "naturalidade") ? "naturalidade" : "NULL"},
      ${hasColumn(db, "associate_profiles", "rg") ? "rg" : "NULL"},
      ${hasColumn(db, "associate_profiles", "cnh") ? "cnh" : "NULL"},
      ${hasColumn(db, "associate_profiles", "estado_civil") ? "estado_civil" : "NULL"},
      ${hasColumn(db, "associate_profiles", "nome_pai") ? "nome_pai" : "NULL"},
      ${hasColumn(db, "associate_profiles", "nome_mae") ? "nome_mae" : "NULL"},
      ${hasColumn(db, "associate_profiles", "dependentes") ? "dependentes" : "NULL"},
      ${hasColumn(db, "associate_profiles", "grau_parentesco") ? "grau_parentesco" : "NULL"},
      ${hasColumn(db, "associate_profiles", "telefone") ? "telefone" : "NULL"},
      ${hasColumn(db, "associate_profiles", "celular") ? "celular" : "NULL"},
      ${hasColumn(db, "associate_profiles", "email") ? "email" : "NULL"},
      ${hasColumn(db, "associate_profiles", "observacoes") ? "observacoes" : "NULL"},
      ${hasColumn(db, "associate_profiles", "situacao_financeira") ? "situacao_financeira" : "NULL"},
      ${hasColumn(db, "associate_profiles", "situacao_documental") ? "situacao_documental" : "NULL"},
      ${hasColumn(db, "associate_profiles", "historico_resumo") ? "historico_resumo" : "NULL"},
      ${hasColumn(db, "associate_profiles", "foto_url") ? "foto_url" : "NULL"},
      old.created_at,
      old.updated_at
    FROM associate_profiles__old old
    INNER JOIN associates
      ON associates.id = old.associate_id
  `);
  db.run("DROP TABLE associate_profiles__old");
}

function normalizeAssociateProfilesLegacyIdentifiers(db: Database) {
  if (!tableExists(db, "associate_profiles")) {
    return;
  }

  const rows = db.exec(`
    SELECT
      associate_id,
      rg,
      cnh,
      cnpj_empresa
    FROM associate_profiles
  `)[0]?.values ?? [];

  for (const row of rows) {
    const associateId = String(row[0]);
    const normalizedRg = normalizeAssociateRg(row[1]);
    const normalizedCnh = normalizeAssociateCnh(row[2]);
    const normalizedCompanyCnpj = normalizeAssociateCompanyCnpj(row[3]);

    db.run(
      `
        UPDATE associate_profiles
        SET
          rg = ?,
          cnh = ?,
          cnpj_empresa = ?
        WHERE associate_id = ?
      `,
      [
        normalizedRg,
        normalizedCnh,
        normalizedCompanyCnpj,
        associateId,
      ],
    );
  }
}

function assertNoDuplicateAssociateProfileIdentifiers(db: Database) {
  assertNoDuplicateAssociateProfileField(db, {
    field: "rg",
    errorCode: "SQLITE_ASSOCIATE_PROFILE_RG_DUPLICATE",
  });
  assertNoDuplicateAssociateProfileField(db, {
    field: "cnh",
    errorCode: "SQLITE_ASSOCIATE_PROFILE_CNH_DUPLICATE",
  });
  assertNoDuplicateAssociateProfileField(db, {
    field: "cnpj_empresa",
    errorCode: "SQLITE_ASSOCIATE_PROFILE_COMPANY_CNPJ_DUPLICATE",
  });
}

function assertNoDuplicateAssociateProfileField(
  db: Database,
  options: {
    field: "rg" | "cnh" | "cnpj_empresa";
    errorCode: string;
  },
) {
  const duplicates = db.exec(
    `
      SELECT
        ${options.field},
        COUNT(*)
      FROM associate_profiles
      WHERE ${options.field} IS NOT NULL
        AND TRIM(${options.field}) <> ''
      GROUP BY ${options.field}
      HAVING COUNT(*) > 1
    `,
  )[0]?.values ?? [];

  if (duplicates.length === 0) {
    return;
  }

  const duplicateDetails = duplicates
    .map((row) => `${String(row[0])} (${Number(row[1])})`)
    .join(", ");

  throw new Error(`${options.errorCode}: ${duplicateDetails}`);
}

function rebuildTaxistaProfilesTable(db: Database) {
  if (!tableExists(db, "taxista_profiles")) {
    return;
  }

  dropLegacyRebuildTableIfExists(db, "taxista_profiles");
  dropIndexIfExists(db, "idx_taxista_profiles_placa");

  db.run("ALTER TABLE taxista_profiles RENAME TO taxista_profiles__old");
  db.run(`
    CREATE TABLE taxista_profiles (
      associate_id TEXT PRIMARY KEY,
      status_alvara TEXT NOT NULL DEFAULT 'CADASTRO',
      selo TEXT,
      ponto TEXT,
      placa TEXT,
      modelo_veiculo TEXT,
      pressao_kgf_m2 TEXT,
      numero_taximetro TEXT,
      modelo_taximetro TEXT,
      constante TEXT,
      inmetro TEXT,
      instalacao TEXT,
      troca_taximetro TEXT,
      pneu TEXT,
      deca TEXT,
      lacre_modulo TEXT,
      lacre_taxi TEXT,
      modulo TEXT,
      cinta TEXT,
      colocado TEXT,
      retirado TEXT,
      observacao TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (associate_id) REFERENCES associates(id) ON DELETE CASCADE
    )
  `);
  db.run(`
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
    )
    SELECT
      old.associate_id,
      COALESCE(${trimmedColumnOrNull(db, "taxista_profiles", "status_alvara")}, 'CADASTRO'),
      ${hasColumn(db, "taxista_profiles", "selo") ? "selo" : "NULL"},
      ${hasColumn(db, "taxista_profiles", "ponto") ? "ponto" : "NULL"},
      ${hasColumn(db, "taxista_profiles", "placa") ? "placa" : "NULL"},
      ${hasColumn(db, "taxista_profiles", "modelo_veiculo") ? "modelo_veiculo" : "NULL"},
      ${hasColumn(db, "taxista_profiles", "pressao_kgf_m2") ? "pressao_kgf_m2" : "NULL"},
      ${hasColumn(db, "taxista_profiles", "numero_taximetro") ? "numero_taximetro" : "NULL"},
      ${hasColumn(db, "taxista_profiles", "modelo_taximetro") ? "modelo_taximetro" : "NULL"},
      ${hasColumn(db, "taxista_profiles", "constante") ? "constante" : "NULL"},
      ${hasColumn(db, "taxista_profiles", "inmetro") ? "inmetro" : "NULL"},
      ${hasColumn(db, "taxista_profiles", "instalacao") ? "instalacao" : "NULL"},
      ${hasColumn(db, "taxista_profiles", "troca_taximetro") ? "troca_taximetro" : "NULL"},
      ${hasColumn(db, "taxista_profiles", "pneu") ? "pneu" : "NULL"},
      ${hasColumn(db, "taxista_profiles", "deca") ? "deca" : "NULL"},
      ${hasColumn(db, "taxista_profiles", "lacre_modulo") ? "lacre_modulo" : "NULL"},
      ${hasColumn(db, "taxista_profiles", "lacre_taxi") ? "lacre_taxi" : "NULL"},
      ${hasColumn(db, "taxista_profiles", "modulo") ? "modulo" : "NULL"},
      ${hasColumn(db, "taxista_profiles", "cinta") ? "cinta" : "NULL"},
      ${hasColumn(db, "taxista_profiles", "colocado") ? "colocado" : "NULL"},
      ${hasColumn(db, "taxista_profiles", "retirado") ? "retirado" : "NULL"},
      ${hasColumn(db, "taxista_profiles", "observacao") ? "observacao" : "NULL"},
      old.created_at,
      old.updated_at
    FROM taxista_profiles__old old
    INNER JOIN associates
      ON associates.id = old.associate_id
  `);
  db.run("DROP TABLE taxista_profiles__old");
}

function migrateLegacySqliteSchema(db: Database) {
  db.run("PRAGMA foreign_keys = OFF");

  try {
    rebuildDocumentsTable(db);
    rebuildAlertsTable(db);
    rebuildPasswordResetTokensTable(db);
    rebuildAssociateOperationProfilesTable(db);
    rebuildAssociateProfilesTable(db);
    rebuildTaxistaProfilesTable(db);
    normalizeAssociateProfilesLegacyIdentifiers(db);
    assertNoDuplicateAssociateProfileIdentifiers(db);
  } finally {
    db.run("PRAGMA foreign_keys = ON");
  }

  const foreignKeyViolations = db.exec("PRAGMA foreign_key_check")[0]?.values ?? [];

  if (foreignKeyViolations.length > 0) {
    throw new Error("SQLITE_FOREIGN_KEY_CHECK_FAILED");
  }
}

function applySqliteSchemaCompatibility(db: Database) {
  ensureColumnExists(
    db,
    "auth_rate_limits",
    "penalty_level",
    "INTEGER NOT NULL DEFAULT 0",
  );
}

function runPendingSqliteSchemaMigrations(
  db: Database,
  currentVersion: number,
) {
  let nextVersion = currentVersion;

  if (nextVersion < 2) {
    applySqliteSchemaCompatibility(db);
    validateAssociateProfileIdentifierUniqueness(db);
    dropAssociateProfileUniqueIndexes(db);
    nextVersion = 2;
  }

  if (nextVersion !== currentVersion) {
    setRecordedSchemaVersion(db, nextVersion);
  }
}

export function createSqliteSchema(db: Database) {
  createSchemaVersionTable(db);

  const recordedVersion = getRecordedSchemaVersion(db);

  if (recordedVersion == null) {
    const hasLegacySchema = hasLegacySchemaWithoutVersion(db);

    createCoreTables(db);

    if (hasLegacySchema) {
      migrateLegacySqliteSchema(db);
      applySqliteSchemaCompatibility(db);
    }

    createIndexes(db);
    setRecordedSchemaVersion(db, CURRENT_SQLITE_SCHEMA_VERSION);
    return;
  }

  createCoreTables(db);
  runPendingSqliteSchemaMigrations(db, recordedVersion);
  createIndexes(db);
}

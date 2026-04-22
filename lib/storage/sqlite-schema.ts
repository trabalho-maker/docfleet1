import type { Database } from "sql.js";

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

function migrateLegacyDocumentColumns(db: Database) {
  const hasLegacyTitle = hasColumn(db, "documents", "title");
  const hasLegacyCategory = hasColumn(db, "documents", "category");
  const hasName = hasColumn(db, "documents", "name");
  const hasType = hasColumn(db, "documents", "type");

  if (!hasName) {
    db.run("ALTER TABLE documents ADD COLUMN name TEXT");
  }

  if (!hasType) {
    db.run("ALTER TABLE documents ADD COLUMN type TEXT");
  }

  if (hasLegacyTitle) {
    db.run("UPDATE documents SET name = COALESCE(name, title) WHERE name IS NULL");
  }

  if (hasLegacyCategory) {
    db.run("UPDATE documents SET type = COALESCE(type, category) WHERE type IS NULL");
  }
}

export function createSqliteSchema(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      password_hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      owner TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      due_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      severity TEXT NOT NULL,
      team TEXT NOT NULL,
      created_at TEXT NOT NULL,
      kind TEXT,
      source_document_id TEXT
    );

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      consumed_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
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

    CREATE TABLE IF NOT EXISTS associate_operation_profiles (
      associate_id TEXT PRIMARY KEY,
      operation_type TEXT NOT NULL,
      basic_documentation_due_date TEXT,
      vehicle_authorization_due_date TEXT,
      driver_authorization_due_date TEXT,
      cargo_licensing_due_date TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (associate_id) REFERENCES associates(id)
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
      FOREIGN KEY (associate_id) REFERENCES associates(id)
    );

    CREATE TABLE IF NOT EXISTS taxista_profiles (
      associate_id TEXT PRIMARY KEY,
      status_alvara TEXT NOT NULL DEFAULT 'CADASTRO',
      selo TEXT,
      ponto TEXT,
      placa TEXT,
      modelo_veiculo TEXT,
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
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (associate_id) REFERENCES associates(id)
    );

    CREATE INDEX IF NOT EXISTS idx_documents_due_date
    ON documents(due_date);

    CREATE INDEX IF NOT EXISTS idx_documents_status
    ON documents(status);

    CREATE INDEX IF NOT EXISTS idx_alerts_created_at
    ON alerts(created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_alerts_kind
    ON alerts(kind);

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

    CREATE INDEX IF NOT EXISTS idx_taxista_profiles_placa
    ON taxista_profiles(placa);
  `);

  migrateLegacyDocumentColumns(db);
  ensureColumnExists(db, "alerts", "kind", "TEXT");
  ensureColumnExists(db, "alerts", "source_document_id", "TEXT");
  ensureColumnExists(db, "associate_profiles", "modalidade_associado", "TEXT");
  ensureColumnExists(db, "associate_profiles", "cnpj_empresa", "TEXT");
  ensureColumnExists(db, "associate_profiles", "nome_empresa", "TEXT");
  ensureColumnExists(
    db,
    "taxista_profiles",
    "status_alvara",
    "TEXT NOT NULL DEFAULT 'CADASTRO'",
  );
  ensureColumnExists(
    db,
    "auth_rate_limits",
    "penalty_level",
    "INTEGER NOT NULL DEFAULT 0",
  );
}

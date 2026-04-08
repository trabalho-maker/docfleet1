import type { Database } from "sql.js";

function ensureColumnExists(
  db: Database,
  tableName: string,
  columnName: string,
  definition: string,
) {
  const columns = db.exec(`PRAGMA table_info(${tableName})`)[0]?.values ?? [];
  const hasColumn = columns.some((column) => String(column[1]) === columnName);

  if (!hasColumn) {
    db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
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
      title TEXT NOT NULL,
      owner TEXT NOT NULL,
      category TEXT NOT NULL,
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
  `);

  ensureColumnExists(db, "alerts", "kind", "TEXT");
  ensureColumnExists(db, "alerts", "source_document_id", "TEXT");
  ensureColumnExists(
    db,
    "auth_rate_limits",
    "penalty_level",
    "INTEGER NOT NULL DEFAULT 0",
  );
}

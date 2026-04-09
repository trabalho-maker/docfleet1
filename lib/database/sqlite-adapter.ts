import type { BindParams, Database } from "sql.js";
import type { DatabaseAdapter, DatabaseRow, DatabaseWriteOptions, DatabaseWriteSession } from "@/lib/database/adapter";
import { withSqliteDatabase, withSqliteWriteLock } from "@/lib/storage/sqlite-storage";

function normalizeRows(result: { values?: unknown[][] }[] | undefined): DatabaseRow[] {
  return result?.[0]?.values ?? [];
}

function toBindParams(params: unknown[] = []): BindParams {
  return params as BindParams;
}

function createSqliteWriteSession(db: Database): DatabaseWriteSession {
  return {
    async query(sql, params = []) {
      return normalizeRows(db.exec(sql, toBindParams(params)));
    },
    async queryOne(sql, params = []) {
      return normalizeRows(db.exec(sql, toBindParams(params)))[0] ?? null;
    },
    async queryValue(sql, params = []) {
      return normalizeRows(db.exec(sql, toBindParams(params)))[0]?.[0] ?? null;
    },
    async execute(sql, params = []) {
      db.run(sql, toBindParams(params));
    },
  };
}

export class SqliteDatabaseAdapter implements DatabaseAdapter {
  readonly provider = "sqlite" as const;

  async query(sql: string, params: unknown[] = []): Promise<DatabaseRow[]> {
    return withSqliteDatabase(async (db) => normalizeRows(db.exec(sql, toBindParams(params))));
  }

  async queryOne(sql: string, params: unknown[] = []): Promise<DatabaseRow | null> {
    const rows = await this.query(sql, params);
    return rows[0] ?? null;
  }

  async queryValue(sql: string, params: unknown[] = []): Promise<unknown> {
    const row = await this.queryOne(sql, params);
    return row?.[0] ?? null;
  }

  async write<T>(
    operation: (session: DatabaseWriteSession) => Promise<T> | T,
    options?: DatabaseWriteOptions,
  ): Promise<T> {
    return withSqliteWriteLock(
      async (db) => operation(createSqliteWriteSession(db)),
      options,
    );
  }
}

import { DatabaseSync } from "node:sqlite";

type SqliteStatementColumn = {
  name: string;
};

type SqliteStatement = {
  all(...params: unknown[]): unknown[][];
  run(...params: unknown[]): unknown;
  columns(): SqliteStatementColumn[];
  setReturnArrays(enabled: boolean): void;
};

type NativeSqliteDatabase = {
  exec(sql: string): void;
  prepare(sql: string): SqliteStatement;
  close(): void;
};

export type SqliteExecResult = {
  columns?: string[];
  values?: unknown[][];
};

function hasMultipleStatements(sql: string) {
  return sql
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean).length > 1;
}

export class SqliteDatabaseConnection {
  constructor(private readonly database: NativeSqliteDatabase) {}

  exec(sql: string, params: unknown[] = []): SqliteExecResult[] {
    if (hasMultipleStatements(sql)) {
      if (params.length > 0) {
        throw new Error("SQLITE_MULTI_STATEMENT_PARAMS_UNSUPPORTED");
      }

      this.database.exec(sql);
      return [];
    }

    const statement = this.database.prepare(sql);
    statement.setReturnArrays(true);
    const columns = statement.columns().map((column) => column.name);

    if (columns.length === 0) {
      statement.run(...params);
      return [];
    }

    return [
      {
        columns,
        values: statement.all(...params),
      },
    ];
  }

  run(sql: string, params: unknown[] = []) {
    if (hasMultipleStatements(sql)) {
      if (params.length > 0) {
        throw new Error("SQLITE_MULTI_STATEMENT_PARAMS_UNSUPPORTED");
      }

      this.database.exec(sql);
      return;
    }

    this.database.prepare(sql).run(...params);
  }

  close() {
    this.database.close();
  }
}

export function openSqliteDatabase(path: string) {
  return new SqliteDatabaseConnection(new DatabaseSync(path));
}

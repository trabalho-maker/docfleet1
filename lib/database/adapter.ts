export type DatabaseProvider = "sqlite" | "postgres" | "mysql";

export type DatabaseRow = unknown[];

export type DatabaseWriteOptions = {
  persist?: "deferred" | "immediate";
  reason?: string;
};

export interface DatabaseReadSession {
  query(sql: string, params?: unknown[]): Promise<DatabaseRow[]>;
  queryOne(sql: string, params?: unknown[]): Promise<DatabaseRow | null>;
  queryValue(sql: string, params?: unknown[]): Promise<unknown>;
}

export interface DatabaseWriteSession extends DatabaseReadSession {
  execute(sql: string, params?: unknown[]): Promise<void>;
}

export interface DatabaseAdapter extends DatabaseReadSession {
  readonly provider: DatabaseProvider;
  write<T>(
    operation: (session: DatabaseWriteSession) => Promise<T> | T,
    options?: DatabaseWriteOptions,
  ): Promise<T>;
}

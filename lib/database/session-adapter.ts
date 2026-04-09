import type {
  DatabaseAdapter,
  DatabaseProvider,
  DatabaseRow,
  DatabaseWriteOptions,
  DatabaseWriteSession,
} from "@/lib/database/adapter";

export class SessionDatabaseAdapter implements DatabaseAdapter {
  constructor(
    public readonly provider: DatabaseProvider,
    private readonly session: DatabaseWriteSession,
  ) {}

  async query(sql: string, params: unknown[] = []): Promise<DatabaseRow[]> {
    return this.session.query(sql, params);
  }

  async queryOne(sql: string, params: unknown[] = []): Promise<DatabaseRow | null> {
    return this.session.queryOne(sql, params);
  }

  async queryValue(sql: string, params: unknown[] = []): Promise<unknown> {
    return this.session.queryValue(sql, params);
  }

  async write<T>(
    operation: (session: DatabaseWriteSession) => Promise<T> | T,
    options?: DatabaseWriteOptions,
  ): Promise<T> {
    void options;
    return operation(this.session);
  }
}

export function createSessionDatabaseAdapter(
  provider: DatabaseProvider,
  session: DatabaseWriteSession,
) {
  return new SessionDatabaseAdapter(provider, session);
}

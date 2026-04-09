import type { DatabaseAdapter, DatabaseProvider } from "@/lib/database/adapter";
import { SqliteDatabaseAdapter } from "@/lib/database/sqlite-adapter";

let databaseAdapter: DatabaseAdapter | null = null;

export function resolveDatabaseProvider(): DatabaseProvider {
  const configuredProvider = process.env.DATABASE_PROVIDER?.trim().toLowerCase();

  if (!configuredProvider) {
    return "sqlite";
  }

  if (
    configuredProvider === "sqlite" ||
    configuredProvider === "postgres" ||
    configuredProvider === "mysql"
  ) {
    return configuredProvider;
  }

  throw new Error(`Unsupported database provider: ${configuredProvider}`);
}

export function createDatabaseAdapter(provider = resolveDatabaseProvider()): DatabaseAdapter {
  if (provider === "sqlite") {
    return new SqliteDatabaseAdapter();
  }

  throw new Error(
    `Database provider "${provider}" is not implemented yet. Add a ${provider} adapter in lib/database and reuse the existing repository interfaces.`,
  );
}

export function getDatabaseAdapter() {
  if (!databaseAdapter) {
    databaseAdapter = createDatabaseAdapter();
  }

  return databaseAdapter;
}

export function setDatabaseAdapter(adapter: DatabaseAdapter | null) {
  databaseAdapter = adapter;
}

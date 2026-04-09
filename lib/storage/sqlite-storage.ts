import type { Database } from "sql.js";

type SqliteStorageRuntime = typeof import("./sqlite-storage-runtime");

let runtimePromise: Promise<SqliteStorageRuntime> | null = null;

function getSqliteStorageRuntime() {
  if (!runtimePromise) {
    runtimePromise = import("./sqlite-storage-runtime");
  }

  return runtimePromise;
}

export async function getSqliteDatabase() {
  const runtime = await getSqliteStorageRuntime();
  return runtime.getSqliteDatabase();
}

export async function persistSqliteDatabase(reason = "manual") {
  const runtime = await getSqliteStorageRuntime();
  return runtime.persistSqliteDatabase(reason);
}

export async function withSqliteDatabase<T>(
  operation: (db: Database) => Promise<T> | T,
): Promise<T> {
  const runtime = await getSqliteStorageRuntime();
  return runtime.withSqliteDatabase(operation);
}

export async function withSqliteWriteLock<T>(
  operation: (db: Database) => Promise<T> | T,
  options?: {
    persist?: "deferred" | "immediate";
    reason?: string;
  },
): Promise<T> {
  const runtime = await getSqliteStorageRuntime();
  return runtime.withSqliteWriteLock(operation, options);
}

export async function flushSqliteDatabase(reason = "flush") {
  const runtime = await getSqliteStorageRuntime();
  return runtime.flushSqliteDatabase(reason);
}

export async function resetSqliteDatabase() {
  const runtime = await getSqliteStorageRuntime();
  return runtime.resetSqliteDatabase();
}

export async function resetSqliteStorageState() {
  const runtime = await getSqliteStorageRuntime();
  return runtime.resetSqliteStorageState();
}

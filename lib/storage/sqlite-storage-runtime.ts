import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import initSqlJs, { type Database } from "sql.js";
import { createSqliteSchema } from "@/lib/storage/sqlite-schema";
import { seedSqliteDatabase } from "@/features/data/seed/seed-sqlite-db";
import { logger } from "@/lib/logger";
import {
  getSqliteDatabasePath,
  getSqlJsWasmDirectory,
} from "@/lib/server/runtime-paths";

// IMPORTANT:
// This runtime keeps a single in-memory sql.js database per Node.js process and
// periodically persists full snapshots to disk. It is safe only for single-
// process usage and must not be treated as a concurrent multi-instance store.
// For horizontal scaling or shared-write workloads, migrate to a real database
// adapter (for example Postgres/MySQL) instead of reusing this runtime.

let sqlJsPromise: ReturnType<typeof initSqlJs> | null = null;
let writeQueue = Promise.resolve();
let databasePromise: Promise<Database> | null = null;
let databaseInstance: Database | null = null;
let isDatabaseDirty = false;
let persistTimer: ReturnType<typeof setTimeout> | null = null;

const SQLITE_PERSIST_DEBOUNCE_MS = Number.parseInt(
  process.env.SQLITE_PERSIST_DEBOUNCE_MS ?? "100",
  10,
);

async function getSqlJs() {
  if (!sqlJsPromise) {
    sqlJsPromise = initSqlJs({
      locateFile: (file) => path.join(getSqlJsWasmDirectory(), file),
    });
  }

  return sqlJsPromise;
}

async function writeDatabaseSnapshot(db: Database, reason: string) {
  const databasePath = getSqliteDatabasePath();
  await mkdir(path.dirname(databasePath), { recursive: true });
  await writeFile(databasePath, Buffer.from(db.export()));
  logger.info("storage.sqlite.persisted", {
    databasePath,
    reason,
  });
}

function configureSqliteConnection(db: Database) {
  db.run("PRAGMA foreign_keys = ON");
}

async function loadSqliteDatabase(): Promise<Database> {
  const databasePath = getSqliteDatabasePath();
  await mkdir(path.dirname(databasePath), { recursive: true });

  const SQL = await getSqlJs();

  try {
    const file = await readFile(databasePath);
    const db = new SQL.Database(new Uint8Array(file));
    configureSqliteConnection(db);
    createSqliteSchema(db);
    logger.info("storage.sqlite.loaded", {
      databasePath,
      source: "disk",
      mode: "singleton",
    });
    return db;
  } catch {
    const db = new SQL.Database();
    configureSqliteConnection(db);
    createSqliteSchema(db);
    await seedSqliteDatabase(db);
    await writeDatabaseSnapshot(db, "seed");
    logger.info("storage.sqlite.loaded", {
      databasePath,
      source: "seed",
      mode: "singleton",
    });
    return db;
  }
}

export async function getSqliteDatabase(): Promise<Database> {
  if (databaseInstance) {
    return databaseInstance;
  }

  if (!databasePromise) {
    databasePromise = loadSqliteDatabase().then((db) => {
      databaseInstance = db;
      return db;
    });
  }

  return databasePromise;
}

async function runPersistInCurrentTask(reason: string) {
  if (!isDatabaseDirty) {
    return;
  }

  const db = await getSqliteDatabase();
  isDatabaseDirty = false;
  await writeDatabaseSnapshot(db, reason);
}

function schedulePersist(reason: string) {
  if (persistTimer) {
    return;
  }

  persistTimer = setTimeout(() => {
    persistTimer = null;
    void flushSqliteDatabase(reason);
  }, SQLITE_PERSIST_DEBOUNCE_MS);
}

export async function persistSqliteDatabase(reason = "manual") {
  return flushSqliteDatabase(reason);
}

export async function withSqliteDatabase<T>(
  operation: (db: Database) => Promise<T> | T,
): Promise<T> {
  await writeQueue;
  const db = await getSqliteDatabase();
  configureSqliteConnection(db);
  return operation(db);
}

export async function withSqliteWriteLock<T>(
  operation: (db: Database) => Promise<T> | T,
  options?: {
    persist?: "deferred" | "immediate";
    reason?: string;
  },
): Promise<T> {
  const persistMode = options?.persist ?? "deferred";
  const persistReason = options?.reason ?? "write";
  const run = async () => {
    const db = await getSqliteDatabase();
    configureSqliteConnection(db);
    const result = await operation(db);
    isDatabaseDirty = true;

    if (persistMode === "immediate") {
      await runPersistInCurrentTask(persistReason);
    } else {
      schedulePersist(persistReason);
    }

    return result;
  };

  const next = writeQueue.then(run, run);
  writeQueue = next.then(
    () => undefined,
    () => undefined,
  );

  return next;
}

export async function flushSqliteDatabase(reason = "flush") {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }

  const flushTask = async () => {
    await runPersistInCurrentTask(reason);
  };

  const next = writeQueue.then(flushTask, flushTask);
  writeQueue = next.then(
    () => undefined,
    () => undefined,
  );

  return next;
}

export async function resetSqliteDatabase() {
  return withSqliteWriteLock(
    async (db) => {
      db.run("DROP TABLE IF EXISTS alerts");
      db.run("DROP TABLE IF EXISTS password_reset_tokens");
      db.run("DROP TABLE IF EXISTS auth_rate_limits");
      db.run("DROP TABLE IF EXISTS taxista_profiles");
      db.run("DROP TABLE IF EXISTS associate_operation_profiles");
      db.run("DROP TABLE IF EXISTS associate_profiles");
      db.run("DROP TABLE IF EXISTS documents");
      db.run("DROP TABLE IF EXISTS associates");
      db.run("DROP TABLE IF EXISTS users");
      configureSqliteConnection(db);
      createSqliteSchema(db);
      await seedSqliteDatabase(db);
      logger.warn("storage.sqlite.reset");
    },
    {
      persist: "immediate",
      reason: "reset",
    },
  );
}

export async function resetSqliteStorageState() {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }

  await writeQueue;

  if (databaseInstance) {
    databaseInstance.close();
  }

  writeQueue = Promise.resolve();
  databaseInstance = null;
  databasePromise = null;
  isDatabaseDirty = false;
}

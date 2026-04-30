import { access, mkdir } from "node:fs/promises";
import path from "node:path";
import { createSqliteSchema } from "@/lib/storage/sqlite-schema";
import { seedSqliteDatabase } from "@/features/data/seed/seed-sqlite-db";
import { logger } from "@/lib/logger";
import { getSqliteDatabasePath } from "@/lib/server/runtime-paths";
import {
  openSqliteDatabase,
  type SqliteDatabaseConnection,
} from "@/lib/storage/sqlite-connection";

let writeQueue = Promise.resolve();
let databasePromise: Promise<SqliteDatabaseConnection> | null = null;
let databaseInstance: SqliteDatabaseConnection | null = null;

type ResetSqliteDatabaseOptions = {
  seed?: boolean;
};

async function pathExists(path: string) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function ensureSqlitePragmas(db: SqliteDatabaseConnection) {
  db.run("PRAGMA foreign_keys = ON");
  db.run("PRAGMA busy_timeout = 5000");
}

function initializeSqliteJournalMode(db: SqliteDatabaseConnection) {
  try {
    const journalMode = String(
      db.exec("PRAGMA journal_mode = WAL")[0]?.values?.[0]?.[0] ?? "unknown",
    ).toUpperCase();

    logger.info("storage.sqlite.journal_mode", {
      journalMode,
    });
  } catch (error) {
    logger.warn("storage.sqlite.journal_mode.unavailable", {
      error,
    });
  }
}

async function loadSqliteDatabase(): Promise<SqliteDatabaseConnection> {
  const databasePath = getSqliteDatabasePath();
  await mkdir(path.dirname(databasePath), { recursive: true });

  const isExistingDatabase = await pathExists(databasePath);
  const db = openSqliteDatabase(databasePath);

  ensureSqlitePragmas(db);
  initializeSqliteJournalMode(db);
  createSqliteSchema(db);

  logger.info("storage.sqlite.loaded", {
    databasePath,
    source: isExistingDatabase ? "disk" : "empty",
    mode: "file",
  });

  return db;
}

function shouldSeedAfterReset() {
  return process.env.NODE_ENV === "test" || process.env.E2E_TEST_MODE === "true";
}

export async function getSqliteDatabase(): Promise<SqliteDatabaseConnection> {
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

export async function persistSqliteDatabase(reason = "manual") {
  void reason;
}

export async function withSqliteDatabase<T>(
  operation: (db: SqliteDatabaseConnection) => Promise<T> | T,
): Promise<T> {
  await writeQueue;
  const db = await getSqliteDatabase();
  ensureSqlitePragmas(db);
  return operation(db);
}

export async function withSqliteWriteLock<T>(
  operation: (db: SqliteDatabaseConnection) => Promise<T> | T,
  options?: {
    persist?: "deferred" | "immediate";
    reason?: string;
  },
): Promise<T> {
  void options;

  const run = async () => {
    const db = await getSqliteDatabase();
    ensureSqlitePragmas(db);
    return operation(db);
  };

  const next = writeQueue.then(run, run);
  writeQueue = next.then(
    () => undefined,
    () => undefined,
  );

  return next;
}

export async function flushSqliteDatabase(reason = "flush") {
  void reason;
  await writeQueue;
}

export async function resetSqliteDatabase(options?: ResetSqliteDatabaseOptions) {
  return withSqliteWriteLock(async (db) => {
    db.run("DROP TABLE IF EXISTS alerts__old");
    db.run("DROP TABLE IF EXISTS password_reset_tokens__old");
    db.run("DROP TABLE IF EXISTS taxista_profiles__old");
    db.run("DROP TABLE IF EXISTS associate_operation_profiles__old");
    db.run("DROP TABLE IF EXISTS associate_profiles__old");
    db.run("DROP TABLE IF EXISTS membership_fee_payments__old");
    db.run("DROP TABLE IF EXISTS membership_fee_sheets__old");
    db.run("DROP TABLE IF EXISTS documents__old");
    db.run("DROP TABLE IF EXISTS alerts");
    db.run("DROP TABLE IF EXISTS password_reset_tokens");
    db.run("DROP TABLE IF EXISTS auth_rate_limits");
    db.run("DROP TABLE IF EXISTS taxista_profiles");
    db.run("DROP TABLE IF EXISTS associate_operation_profiles");
    db.run("DROP TABLE IF EXISTS associate_profiles");
    db.run("DROP TABLE IF EXISTS membership_fee_payments");
    db.run("DROP TABLE IF EXISTS membership_fee_sheets");
    db.run("DROP TABLE IF EXISTS documents");
    db.run("DROP TABLE IF EXISTS associates");
    db.run("DROP TABLE IF EXISTS users");
    ensureSqlitePragmas(db);
    createSqliteSchema(db);
    const shouldSeed = options?.seed ?? shouldSeedAfterReset();

    if (shouldSeed) {
      await seedSqliteDatabase(db);
      createSqliteSchema(db);
    }

    logger.warn("storage.sqlite.reset", {
      seeded: shouldSeed,
    });
  });
}

export async function resetSqliteStorageState() {
  await writeQueue;

  if (databaseInstance) {
    databaseInstance.close();
  }

  writeQueue = Promise.resolve();
  databaseInstance = null;
  databasePromise = null;
}

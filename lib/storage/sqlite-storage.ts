import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import initSqlJs, { type Database } from "sql.js";
import { createSqliteSchema } from "@/lib/storage/sqlite-schema";
import { seedSqliteDatabase } from "@/features/data/seed/seed-sqlite-db";
import { logger } from "@/lib/logger";

let sqlJsPromise: ReturnType<typeof initSqlJs> | null = null;
let writeQueue = Promise.resolve();

function getDataDirectory() {
  return path.join(/*turbopackIgnore: true*/ process.cwd(), "data");
}

function getDatabasePath() {
  return process.env.SQLITE_DB_PATH?.trim() || path.join(getDataDirectory(), "app.db");
}

function getSqlWasmDirectory() {
  return path.join(/*turbopackIgnore: true*/ process.cwd(), "node_modules", "sql.js", "dist");
}

async function getSqlJs() {
  if (!sqlJsPromise) {
    sqlJsPromise = initSqlJs({
      locateFile: (file) => path.join(getSqlWasmDirectory(), file),
    });
  }

  return sqlJsPromise;
}

export async function persistSqliteDatabase(db: Database) {
  const databasePath = getDatabasePath();
  await mkdir(path.dirname(databasePath), { recursive: true });
  await writeFile(databasePath, Buffer.from(db.export()));
  logger.info("storage.sqlite.persisted", {
    databasePath,
  });
}

export async function getSqliteDatabase(): Promise<Database> {
  const databasePath = getDatabasePath();
  await mkdir(path.dirname(databasePath), { recursive: true });

  const SQL = await getSqlJs();

  try {
    const file = await readFile(databasePath);
    const db = new SQL.Database(new Uint8Array(file));
    createSqliteSchema(db);
    logger.info("storage.sqlite.loaded", {
      databasePath,
      source: "disk",
    });
    return db;
  } catch {
    const db = new SQL.Database();
    createSqliteSchema(db);
    await seedSqliteDatabase(db);
    await persistSqliteDatabase(db);
    logger.info("storage.sqlite.loaded", {
      databasePath,
      source: "seed",
    });
    return db;
  }
}

export async function withSqliteDatabase<T>(
  operation: (db: Database) => Promise<T> | T,
): Promise<T> {
  const db = await getSqliteDatabase();

  try {
    return await operation(db);
  } finally {
    db.close();
  }
}

export async function withSqliteWriteLock<T>(
  operation: (db: Database) => Promise<T> | T,
): Promise<T> {
  const run = async () => {
    const db = await getSqliteDatabase();
    try {
      const result = await operation(db);
      await persistSqliteDatabase(db);
      return result;
    } finally {
      db.close();
    }
  };

  const next = writeQueue.then(run, run);
  writeQueue = next.then(
    () => undefined,
    () => undefined,
  );

  return next;
}

export async function resetSqliteDatabase() {
  return withSqliteWriteLock(async (db) => {
    db.run("DROP TABLE IF EXISTS users");
    db.run("DROP TABLE IF EXISTS documents");
    db.run("DROP TABLE IF EXISTS alerts");
    db.run("DROP TABLE IF EXISTS password_reset_tokens");
    db.run("DROP TABLE IF EXISTS auth_rate_limits");
    createSqliteSchema(db);
    await seedSqliteDatabase(db);
    logger.warn("storage.sqlite.reset");
  });
}

export async function resetSqliteStorageState() {
  writeQueue = Promise.resolve();
}

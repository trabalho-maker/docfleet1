import { access, copyFile, mkdir, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { loadEnvConfig } from "@next/env";
import { logger } from "@/lib/logger";
import { getSqliteDatabasePath } from "@/lib/server/runtime-paths";
import {
  openSqliteDatabase,
  type SqliteDatabaseConnection,
} from "@/lib/storage/sqlite-connection";

const BACKUP_FILE_PREFIX = "docfleet-sqlite-backup-";
const BACKUP_FILE_EXTENSION = ".sqlite";
const DEFAULT_BACKUP_RETENTION = 14;

export type SqliteIntegrityValidationResult = {
  integrityCheck: string[];
  foreignKeyViolations: unknown[][];
};

export type SqliteBackupFileInfo = {
  path: string;
  fileName: string;
  createdAtMs: number;
};

export function initializeScriptEnvironment() {
  loadEnvConfig(process.cwd());
}

export function getBackupsDirectory() {
  return path.join(process.cwd(), "backups");
}

export function getRestoreTestDirectory() {
  return path.join(getBackupsDirectory(), "restore-tests");
}

export function getLiveDatabasePath() {
  return getSqliteDatabasePath();
}

export function formatBackupTimestamp(date = new Date()) {
  const year = String(date.getUTCFullYear());
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");
  const milliseconds = String(date.getUTCMilliseconds()).padStart(3, "0");

  return `${year}${month}${day}T${hours}${minutes}${seconds}${milliseconds}Z`;
}

export function buildTimestampedBackupPath(timestamp = formatBackupTimestamp()) {
  return path.join(
    getBackupsDirectory(),
    `${BACKUP_FILE_PREFIX}${timestamp}${BACKUP_FILE_EXTENSION}`,
  );
}

export function parseRetentionDays(rawValue: string | undefined) {
  if (!rawValue) {
    return DEFAULT_BACKUP_RETENTION;
  }

  const parsedValue = Number.parseInt(rawValue, 10);

  if (!Number.isFinite(parsedValue) || parsedValue < 1) {
    throw new Error(`SQLITE_BACKUP_RETENTION_INVALID:${rawValue}`);
  }

  return parsedValue;
}

export function escapeSqliteStringLiteral(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

export async function ensureDirectoryExists(directoryPath: string) {
  await mkdir(directoryPath, { recursive: true });
}

export async function ensureFileExists(filePath: string) {
  try {
    await access(filePath);
  } catch {
    throw new Error(`SQLITE_DATABASE_FILE_NOT_FOUND:${filePath}`);
  }
}

export function openManagedSqliteConnection(databasePath: string) {
  const db = openSqliteDatabase(databasePath);
  db.run("PRAGMA foreign_keys = ON");
  db.run("PRAGMA busy_timeout = 5000");
  return db;
}

export function checkpointWal(db: SqliteDatabaseConnection) {
  try {
    const checkpointValues = db.exec("PRAGMA wal_checkpoint(PASSIVE)")[0]?.values?.[0] ?? [];

    logger.info("storage.sqlite.backup.wal_checkpoint", {
      busy: checkpointValues[0] ?? null,
      logFrames: checkpointValues[1] ?? null,
      checkpointedFrames: checkpointValues[2] ?? null,
    });
  } catch (error) {
    logger.warn("storage.sqlite.backup.wal_checkpoint_failed", {
      error,
    });
  }
}

export function validateSqliteDatabaseFile(
  databasePath: string,
): SqliteIntegrityValidationResult {
  const db = openManagedSqliteConnection(databasePath);

  try {
    const integrityRows = db.exec("PRAGMA integrity_check")[0]?.values ?? [];
    const integrityCheck = integrityRows.map((row) => String(row[0] ?? ""));
    const foreignKeyViolations = db.exec("PRAGMA foreign_key_check")[0]?.values ?? [];

    if (integrityCheck.length === 0 || integrityCheck.some((row) => row !== "ok")) {
      throw new Error(
        `SQLITE_INTEGRITY_CHECK_FAILED:${integrityCheck.join(" | ") || "empty-result"}`,
      );
    }

    if (foreignKeyViolations.length > 0) {
      throw new Error(
        `SQLITE_FOREIGN_KEY_CHECK_FAILED:${JSON.stringify(foreignKeyViolations)}`,
      );
    }

    return {
      integrityCheck,
      foreignKeyViolations,
    };
  } finally {
    db.close();
  }
}

export async function listBackupFiles() {
  await ensureDirectoryExists(getBackupsDirectory());
  const entries = await readdir(getBackupsDirectory(), { withFileTypes: true });
  const files: SqliteBackupFileInfo[] = [];

  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }

    if (
      !entry.name.startsWith(BACKUP_FILE_PREFIX) ||
      !entry.name.endsWith(BACKUP_FILE_EXTENSION)
    ) {
      continue;
    }

    const absolutePath = path.join(getBackupsDirectory(), entry.name);
    const fileStat = await stat(absolutePath);

    files.push({
      path: absolutePath,
      fileName: entry.name,
      createdAtMs: fileStat.mtimeMs,
    });
  }

  return files.sort((left, right) => right.createdAtMs - left.createdAtMs);
}

export async function pruneBackupFiles(retentionDays: number) {
  const files = await listBackupFiles();
  const cutoffMs = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  const removedFiles: string[] = [];

  for (const file of files) {
    if (file.createdAtMs >= cutoffMs) {
      continue;
    }

    await rm(file.path, { force: true });
    removedFiles.push(file.path);
  }

  if (removedFiles.length > 0) {
    logger.info("storage.sqlite.backup.retention_pruned", {
      removedCount: removedFiles.length,
      retentionDays,
    });
  }

  return removedFiles;
}

export async function resolveLatestBackupFile() {
  const [latestFile] = await listBackupFiles();

  if (!latestFile) {
    throw new Error("SQLITE_BACKUP_FILE_NOT_FOUND:latest");
  }

  return latestFile.path;
}

export async function copyBackupForRestoreTest(sourcePath: string, targetPath: string) {
  await ensureDirectoryExists(path.dirname(targetPath));
  await copyFile(sourcePath, targetPath);
}

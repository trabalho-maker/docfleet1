import path from "node:path";
import {
  buildTimestampedBackupPath,
  checkpointWal,
  ensureDirectoryExists,
  ensureFileExists,
  escapeSqliteStringLiteral,
  getBackupsDirectory,
  getLiveDatabasePath,
  initializeScriptEnvironment,
  openManagedSqliteConnection,
  parseRetentionDays,
  pruneBackupFiles,
  validateSqliteDatabaseFile,
} from "./sqlite-backup-utils";
import { logger } from "@/lib/logger";

type BackupCliOptions = {
  retentionDays: number;
};

function parseCliOptions(argv: string[]): BackupCliOptions {
  const retentionArgument = argv.find((argument) => argument.startsWith("--retain-days="));
  const retentionValue = retentionArgument?.split("=")[1] ?? process.env.SQLITE_BACKUP_RETENTION;

  return {
    retentionDays: parseRetentionDays(retentionValue),
  };
}

async function runBackup() {
  initializeScriptEnvironment();

  const options = parseCliOptions(process.argv.slice(2));
  const sourceDatabasePath = getLiveDatabasePath();
  const backupDirectory = getBackupsDirectory();
  const backupPath = buildTimestampedBackupPath();

  await ensureFileExists(sourceDatabasePath);
  await ensureDirectoryExists(backupDirectory);

  const db = openManagedSqliteConnection(sourceDatabasePath);

  try {
    checkpointWal(db);
    db.run(`VACUUM INTO ${escapeSqliteStringLiteral(backupPath)}`);
  } finally {
    db.close();
  }

  const validation = validateSqliteDatabaseFile(backupPath);
  const removedFiles = await pruneBackupFiles(options.retentionDays);

  logger.info("storage.sqlite.backup.completed", {
    sourceDatabasePath,
    backupPath,
    backupDirectory,
    retentionDays: options.retentionDays,
    prunedBackups: removedFiles.length,
    integrityCheck: validation.integrityCheck.join(","),
  });

  console.log(
    [
      "SQLite backup concluido com sucesso.",
      `Origem: ${sourceDatabasePath}`,
      `Backup: ${backupPath}`,
      `Integridade: ${validation.integrityCheck.join(", ")}`,
      `Retencao aplicada: ${options.retentionDays} dia(s)`,
    ].join("\n"),
  );
}

runBackup().catch((error) => {
  logger.error("storage.sqlite.backup.failed", {
    error,
    attemptedBackupPath: path.join(getBackupsDirectory(), "pending"),
  });
  console.error("Falha ao gerar backup SQLite.", error);
  process.exit(1);
});

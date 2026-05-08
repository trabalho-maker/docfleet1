import path from "node:path";
import {
  copyBackupForRestoreTest,
  ensureDirectoryExists,
  ensureFileExists,
  formatBackupTimestamp,
  getRestoreTestDirectory,
  initializeScriptEnvironment,
  openManagedSqliteConnection,
  resolveLatestBackupFile,
  validateSqliteDatabaseFile,
} from "./sqlite-backup-utils";
import { logger } from "@/lib/logger";

type RestoreTestCliOptions = {
  backupPath?: string;
};

function parseCliOptions(argv: string[]): RestoreTestCliOptions {
  const fileArgument = argv.find((argument) => argument.startsWith("--file="));
  return {
    backupPath: fileArgument?.slice("--file=".length),
  };
}

async function runRestoreTest() {
  initializeScriptEnvironment();

  const options = parseCliOptions(process.argv.slice(2));
  const backupPath = options.backupPath
    ? path.resolve(process.cwd(), options.backupPath)
    : await resolveLatestBackupFile();
  const restoreDirectory = getRestoreTestDirectory();
  const restorePath = path.join(
    restoreDirectory,
    `restore-test-${formatBackupTimestamp()}.db`,
  );

  await ensureFileExists(backupPath);
  await ensureDirectoryExists(restoreDirectory);
  await copyBackupForRestoreTest(backupPath, restorePath);

  const db = openManagedSqliteConnection(restorePath);

  try {
    db.exec("PRAGMA journal_mode = WAL");
  } finally {
    db.close();
  }

  const validation = validateSqliteDatabaseFile(restorePath);

  logger.info("storage.sqlite.restore_test.completed", {
    backupPath,
    restorePath,
    integrityCheck: validation.integrityCheck.join(","),
  });

  console.log(
    [
      "Restore test concluido com sucesso.",
      `Backup validado: ${backupPath}`,
      `Copia restaurada: ${restorePath}`,
      `Integridade: ${validation.integrityCheck.join(", ")}`,
    ].join("\n"),
  );
}

runRestoreTest().catch((error) => {
  logger.error("storage.sqlite.restore_test.failed", {
    error,
  });
  console.error("Falha ao validar restore do backup SQLite.", error);
  process.exit(1);
});

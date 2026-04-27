import { loadEnvConfig } from "@next/env";
import { resetSqliteDatabase } from "@/lib/storage/sqlite-storage";

async function main() {
  loadEnvConfig(process.cwd());
  await resetSqliteDatabase({ seed: true });
  console.log(
    "SQLite demo seed recreated at data/app.db. This command resets the local database and should not be used in production.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

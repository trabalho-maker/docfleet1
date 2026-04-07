import { loadEnvConfig } from "@next/env";
import { resetSqliteDatabase } from "@/lib/storage/sqlite-storage";

async function main() {
  loadEnvConfig(process.cwd());
  await resetSqliteDatabase();
  console.log("SQLite database seeded at data/app.db");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

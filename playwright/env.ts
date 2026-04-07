import path from "node:path";

const rootDirectory = process.cwd();

export const e2eBaseUrl = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
export const e2eDatabasePath = path.join(rootDirectory, "data", "e2e.db");
export const e2eEmailOutboxPath = path.join(
  rootDirectory,
  "data",
  "e2e-email-outbox.json",
);

export function getPlaywrightServerEnv() {
  return {
    ...process.env,
    AUTH_SECRET: process.env.AUTH_SECRET || "docfleet-e2e-secret",
    AUTH_TRUST_HOST: "true",
    NEXT_PUBLIC_APP_URL: e2eBaseUrl,
    SQLITE_DB_PATH: e2eDatabasePath,
    EMAIL_TRANSPORT: "file",
    EMAIL_FILE_OUTBOX_PATH: e2eEmailOutboxPath,
    SEED_USER_NAME: process.env.SEED_USER_NAME || "Operacoes DocFleet",
    SEED_USER_EMAIL: process.env.SEED_USER_EMAIL || "operacoes@docfleet.local",
    SEED_USER_PASSWORD: process.env.SEED_USER_PASSWORD || "Senha1234",
    SEED_USER_ROLE: process.env.SEED_USER_ROLE || "Gestor de frota",
    NEXT_PUBLIC_DEV_SEED_USER_EMAIL:
      process.env.NEXT_PUBLIC_DEV_SEED_USER_EMAIL ||
      process.env.SEED_USER_EMAIL ||
      "operacoes@docfleet.local",
    NEXT_PUBLIC_DEV_SEED_USER_PASSWORD:
      process.env.NEXT_PUBLIC_DEV_SEED_USER_PASSWORD ||
      process.env.SEED_USER_PASSWORD ||
      "Senha1234",
  };
}

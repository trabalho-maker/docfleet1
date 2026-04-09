import path from "node:path";

const rootDirectory = process.cwd();
const e2eRuntimeDirectory = path.join(rootDirectory, ".e2e");

export function resolveE2EBaseUrl() {
  return process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3100";
}

export const e2eBaseUrl = resolveE2EBaseUrl();
export const e2eDatabasePath = path.join(e2eRuntimeDirectory, "app.db");
export const e2eEmailOutboxPath = path.join(e2eRuntimeDirectory, "email-outbox.json");
export const e2eResetToken = "docfleet-e2e-reset-token";
export const e2eUser = {
  name: "Operacoes DocFleet",
  email: "operacoes@docfleet.local",
  password: "Senha1234",
  role: "Gestor de frota",
};

export function getPlaywrightServerEnv() {
  return {
    ...process.env,
    AUTH_SECRET: process.env.AUTH_SECRET || "docfleet-e2e-secret",
    AUTH_TRUST_HOST: "true",
    NEXT_PUBLIC_APP_URL: resolveE2EBaseUrl(),
    EMAIL_TRANSPORT: "file",
    E2E_TEST_MODE: "true",
    E2E_RESET_TOKEN: e2eResetToken,
    SEED_USER_NAME: e2eUser.name,
    SEED_USER_EMAIL: e2eUser.email,
    SEED_USER_PASSWORD: e2eUser.password,
    SEED_USER_ROLE: e2eUser.role,
    NEXT_PUBLIC_DEV_SEED_USER_EMAIL: e2eUser.email,
    NEXT_PUBLIC_DEV_SEED_USER_PASSWORD: e2eUser.password,
  };
}

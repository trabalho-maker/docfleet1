import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { loadEnvConfig } from "@next/env";
import { e2eDatabasePath, e2eEmailOutboxPath, getPlaywrightServerEnv } from "./env";

async function runSeedScript() {
  const tsxCli = path.join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs");

  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [tsxCli, "scripts/seed-sqlite-db.ts"],
      {
        cwd: process.cwd(),
        env: getPlaywrightServerEnv(),
        stdio: "inherit",
      },
    );

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`E2E seed failed with exit code ${code ?? "unknown"}.`));
    });
  });
}

export default async function globalSetup() {
  loadEnvConfig(process.cwd());
  await mkdir(path.dirname(e2eDatabasePath), { recursive: true });
  await rm(e2eDatabasePath, { force: true });
  await rm(e2eEmailOutboxPath, { force: true });
  await runSeedScript();
}

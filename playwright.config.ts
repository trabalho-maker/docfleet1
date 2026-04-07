import { defineConfig, devices } from "@playwright/test";
import { loadEnvConfig } from "@next/env";
import { e2eBaseUrl, getPlaywrightServerEnv } from "./playwright/env";

loadEnvConfig(process.cwd());

const shouldUseManagedWebServer = process.env.PLAYWRIGHT_EXTERNAL_SERVER !== "true";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: e2eBaseUrl,
    trace: "on-first-retry",
  },
  globalSetup: "./playwright/global-setup.ts",
  ...(shouldUseManagedWebServer
    ? {
        webServer: {
          command: "npx next start -H 127.0.0.1 -p 3000",
          url: e2eBaseUrl,
          reuseExistingServer: false,
          timeout: 120_000,
          env: getPlaywrightServerEnv(),
        },
      }
    : {}),
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
});

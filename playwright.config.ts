import { defineConfig, devices } from "@playwright/test";
import { getPlaywrightServerEnv, resolveE2EBaseUrl } from "./playwright/env";

const shouldUseManagedWebServer = process.env.PLAYWRIGHT_EXTERNAL_SERVER !== "true";
const e2eBaseUrl = resolveE2EBaseUrl();

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: e2eBaseUrl,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  ...(shouldUseManagedWebServer
    ? {
        webServer: {
          command: "npm run start -- --hostname 127.0.0.1 --port 3100",
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
        ...devices["Desktop Chromium"],
      },
    },
  ],
});

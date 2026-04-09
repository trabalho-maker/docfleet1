import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import process from "node:process";

const projectRoot = process.cwd();
const e2eUser = {
  name: "Operacoes DocFleet",
  email: "operacoes@docfleet.local",
  password: "Senha1234",
  role: "Gestor de frota",
};
const e2eResetToken = "docfleet-e2e-reset-token";

async function waitForServer(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${url}/login`, { redirect: "manual" });

      if (response.status >= 200 && response.status < 500) {
        return;
      }
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Timed out waiting for E2E server at ${url}.`);
}

async function findAvailablePort(startPort, maxAttempts = 20) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const port = startPort + attempt;
    const isAvailable = await new Promise((resolve) => {
      const server = net.createServer();

      server.once("error", () => resolve(false));
      server.once("listening", () => {
        server.close(() => resolve(true));
      });
      server.listen(port, "127.0.0.1");
    });

    if (isAvailable) {
      return port;
    }
  }

  throw new Error(`Could not find an available port starting at ${startPort}.`);
}

function spawnProcess(command, args, env) {
  return spawn(command, args, {
    cwd: projectRoot,
    env,
    stdio: "inherit",
  });
}

async function stopProcessTree(child) {
  if (!child?.pid) {
    return;
  }

  if (process.platform === "win32") {
    await new Promise((resolve) => {
      const killer = spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
        stdio: "ignore",
      });

      killer.on("exit", () => resolve());
      killer.on("error", () => resolve());
    });
    return;
  }

  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {}
}

async function run() {
  const serverPort = await findAvailablePort(3100);
  const e2eBaseUrl = `http://127.0.0.1:${serverPort}`;
  const env = {
    ...process.env,
    PLAYWRIGHT_BASE_URL: e2eBaseUrl,
    PLAYWRIGHT_EXTERNAL_SERVER: "true",
    AUTH_SECRET: process.env.AUTH_SECRET || "docfleet-e2e-secret",
    AUTH_TRUST_HOST: "true",
    NEXT_PUBLIC_APP_URL: e2eBaseUrl,
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

  const nextBinary = path.join(projectRoot, "node_modules", "next", "dist", "bin", "next");
  const playwrightBinary = path.join(
    projectRoot,
    "node_modules",
    "playwright",
    "cli.js",
  );

  const server = spawnProcess(process.execPath, [nextBinary, "start", "-H", "127.0.0.1", "-p", String(serverPort)], env);
  let testRunner;

  try {
    await waitForServer(e2eBaseUrl, 120_000);

    const testExitCode = await new Promise((resolve, reject) => {
      testRunner = spawnProcess(process.execPath, [playwrightBinary, "test"], env);

      testRunner.on("error", reject);
      testRunner.on("close", (code) => resolve(code ?? 1));
    });

    process.exitCode = testExitCode;
  } finally {
    await stopProcessTree(testRunner);
    await stopProcessTree(server);
  }
}

run().catch(async (error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => {
  process.exit(process.exitCode ?? 0);
});

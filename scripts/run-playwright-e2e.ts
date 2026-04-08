import { spawn, type ChildProcess } from "node:child_process";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import { getPlaywrightServerEnv } from "@/playwright/env";

const projectRoot = process.cwd();

async function waitForServer(url: string, timeoutMs: number) {
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

async function findAvailablePort(startPort: number, maxAttempts = 20) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const port = startPort + attempt;
    const isAvailable = await new Promise<boolean>((resolve) => {
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

function spawnProcess(command: string, args: string[], env: NodeJS.ProcessEnv) {
  return spawn(command, args, {
    cwd: projectRoot,
    env,
    stdio: "inherit",
  });
}

async function stopProcessTree(child: ChildProcess | null | undefined) {
  if (!child?.pid) {
    return;
  }

  if (process.platform === "win32") {
    await new Promise<void>((resolve) => {
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
    ...getPlaywrightServerEnv(),
    PLAYWRIGHT_BASE_URL: e2eBaseUrl,
    PLAYWRIGHT_EXTERNAL_SERVER: "true",
  };

  const nextBinary = path.join(
    projectRoot,
    "node_modules",
    "next",
    "dist",
    "bin",
    "next",
  );
  const playwrightBinary = path.join(
    projectRoot,
    "node_modules",
    "playwright",
    "cli.js",
  );

  const server = spawnProcess(process.execPath, [nextBinary, "start", "-H", "127.0.0.1", "-p", String(serverPort)], env);

  try {
    await waitForServer(e2eBaseUrl, 120_000);

    const testExitCode = await new Promise<number>((resolve, reject) => {
      const testRunner = spawnProcess(process.execPath, [playwrightBinary, "test"], env);

      testRunner.on("error", reject);
      testRunner.on("exit", (code) => resolve(code ?? 1));
    });

    process.exitCode = testExitCode;
  } finally {
    await stopProcessTree(server);
  }
}

run().catch(async (error) => {
  console.error(error);
  process.exitCode = 1;
});

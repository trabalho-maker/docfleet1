import path from "node:path";

function getProjectRoot() {
  return /*turbopackIgnore: true*/ process.cwd();
}

export function getSqliteDatabasePath() {
  if (process.env.E2E_TEST_MODE === "true") {
    return path.join(getProjectRoot(), ".e2e", "app.db");
  }

  if (process.env.NODE_ENV === "test") {
    return path.join(getProjectRoot(), "data", "test.db");
  }

  return path.join(getProjectRoot(), "data", "app.db");
}

export function getEmailOutboxPath() {
  if (process.env.E2E_TEST_MODE === "true") {
    return path.join(getProjectRoot(), ".e2e", "email-outbox.json");
  }

  return path.join(getProjectRoot(), "data", "email-outbox.json");
}

export function getSqlJsWasmDirectory() {
  return path.join(getProjectRoot(), "node_modules", "sql.js", "dist");
}

import path from "node:path";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

process.env.SEED_USER_NAME = process.env.SEED_USER_NAME || "Operacoes DocFleet";
process.env.SEED_USER_EMAIL =
  process.env.SEED_USER_EMAIL || "operacoes@docfleet.local";
process.env.SEED_USER_PASSWORD = process.env.SEED_USER_PASSWORD || "admin123";
process.env.SEED_USER_ROLE = process.env.SEED_USER_ROLE || "Gestor de frota";
process.env.SQLITE_DB_PATH =
  process.env.SQLITE_DB_PATH || path.join(process.cwd(), "data", "test.db");

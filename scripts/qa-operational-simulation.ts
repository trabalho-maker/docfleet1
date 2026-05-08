import { loadEnvConfig } from "@next/env";
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import { createAssociateService } from "@/features/associates/server/associate.service";
import { reconcileDocumentExpirationAlerts } from "@/features/alerts/server/document-expiration-alert-service";
import { createDocumentWithAlerts } from "@/features/documents/server/document-service";
import { documentTypes, type DocumentType } from "@/features/documents/constants";
import { createMembershipFeeService } from "@/features/membership-fees/server/membership-fee.service";
import { getDatabaseAdapter } from "@/lib/database/provider";
import {
  resetSqliteDatabase,
  resetSqliteStorageState,
} from "@/lib/storage/sqlite-storage";

process.env.E2E_TEST_MODE = "true";
loadEnvConfig(process.cwd());

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const SCRIPT_DIR = dirname(SCRIPT_PATH);
const FIXED_NOW = new Date("2026-05-08T12:00:00.000Z");

type ScenarioKind =
  | "same-process-associates"
  | "same-process-documents"
  | "same-process-membership-distinct"
  | "same-process-membership-duplicate"
  | "cross-process-associates"
  | "cross-process-documents"
  | "cross-process-alerts"
  | "cross-process-membership-duplicate";

type WorkerKind =
  | "associate-create"
  | "document-create"
  | "alert-reconcile"
  | "membership-duplicate";

type OperationOutcome = {
  ok: boolean;
  busy: boolean;
  conflict: boolean;
  durationMs: number;
  errorName?: string;
  errorMessage?: string;
};

type ScenarioSummary = {
  name: ScenarioKind;
  totalOps: number;
  successOps: number;
  busyErrors: number;
  conflictErrors: number;
  otherErrors: number;
  wallTimeMs: number;
  avgOpMs: number;
  p95OpMs: number;
  maxOpMs: number;
  consistency: string[];
};

type WorkerSummary = {
  workerKind: WorkerKind;
  workerId: number;
  totalOps: number;
  successOps: number;
  busyErrors: number;
  conflictErrors: number;
  otherErrors: number;
  wallTimeMs: number;
  durationsMs: number[];
};

type CountSnapshot = {
  associates: number;
  documents: number;
  generatedAlerts: number;
  payments: number;
};

type ScenarioContext = {
  associateIds: string[];
  stressAssociateIds: string[];
};

function parseFlag(name: string) {
  return process.argv.find((argument) => argument.startsWith(`--${name}=`));
}

function getFlagValue(name: string) {
  return parseFlag(name)?.split("=").slice(1).join("=") ?? null;
}

function parseJsonFlag<T>(name: string): T | null {
  const value = getFlagValue(name);

  if (!value) {
    return null;
  }

  return JSON.parse(value) as T;
}

function calculateCpfCheckDigit(digits: number[], factor: number) {
  const total = digits.reduce(
    (sum, digit, index) => sum + digit * (factor - index),
    0,
  );
  const remainder = total % 11;

  return remainder < 2 ? 0 : 11 - remainder;
}

function buildValidCpf(seed: number) {
  const base = String(100_000_000 + seed).padStart(9, "0");
  const digits = base.split("").map(Number);
  const firstDigit = calculateCpfCheckDigit(digits, 10);
  const secondDigit = calculateCpfCheckDigit([...digits, firstDigit], 11);

  return `${base}${firstDigit}${secondDigit}`;
}

function classifyError(error: unknown) {
  const errorName =
    error instanceof Error ? error.name : "UnknownOperationalError";
  const errorMessage =
    error instanceof Error ? error.message : String(error);
  const normalizedMessage = `${errorName} ${errorMessage}`.toUpperCase();

  return {
    errorName,
    errorMessage,
    busy:
      normalizedMessage.includes("SQLITE_BUSY") ||
      normalizedMessage.includes("DATABASE IS LOCKED"),
    conflict:
      normalizedMessage.includes("CONFLICT") ||
      normalizedMessage.includes("ALREADY_EXISTS") ||
      normalizedMessage.includes("ALREADY_PAID"),
  };
}

async function measureOperation(
  operation: () => Promise<unknown>,
): Promise<OperationOutcome> {
  const startedAt = performance.now();

  try {
    await operation();

    return {
      ok: true,
      busy: false,
      conflict: false,
      durationMs: performance.now() - startedAt,
    };
  } catch (error) {
    const classification = classifyError(error);

    return {
      ok: false,
      busy: classification.busy,
      conflict: classification.conflict,
      durationMs: performance.now() - startedAt,
      errorName: classification.errorName,
      errorMessage: classification.errorMessage,
    };
  }
}

function summarizeOperationOutcomes(
  name: ScenarioKind,
  outcomes: OperationOutcome[],
  wallTimeMs: number,
  consistency: string[],
): ScenarioSummary {
  const durations = outcomes.map((outcome) => outcome.durationMs).sort((a, b) => a - b);
  const totalDuration = durations.reduce((sum, value) => sum + value, 0);
  const p95Index =
    durations.length === 0 ? 0 : Math.max(0, Math.ceil(durations.length * 0.95) - 1);

  return {
    name,
    totalOps: outcomes.length,
    successOps: outcomes.filter((outcome) => outcome.ok).length,
    busyErrors: outcomes.filter((outcome) => outcome.busy).length,
    conflictErrors: outcomes.filter((outcome) => outcome.conflict).length,
    otherErrors: outcomes.filter(
      (outcome) => !outcome.ok && !outcome.busy && !outcome.conflict,
    ).length,
    wallTimeMs,
    avgOpMs: durations.length === 0 ? 0 : totalDuration / durations.length,
    p95OpMs: durations[p95Index] ?? 0,
    maxOpMs: durations[durations.length - 1] ?? 0,
    consistency,
  };
}

async function queryCountSnapshot(): Promise<CountSnapshot> {
  const adapter = getDatabaseAdapter();
  const [associates, documents, generatedAlerts, payments] = await Promise.all([
    adapter.queryValue("SELECT COUNT(*) FROM associates"),
    adapter.queryValue("SELECT COUNT(*) FROM documents"),
    adapter.queryValue(
      "SELECT COUNT(*) FROM alerts WHERE kind = 'document_expiration'",
    ),
    adapter.queryValue("SELECT COUNT(*) FROM membership_fee_payments"),
  ]);

  return {
    associates: Number(associates),
    documents: Number(documents),
    generatedAlerts: Number(generatedAlerts),
    payments: Number(payments),
  };
}

async function queryAssociateIds(limit = 20) {
  const adapter = getDatabaseAdapter();
  const rows = await adapter.query(
    `
      SELECT id
      FROM associates
      ORDER BY created_at ASC, id ASC
      LIMIT ?
    `,
    [limit],
  );

  return rows.map((row) => String(row[0]));
}

async function queryPaymentCountByCompetence(
  associateId: string,
  competenceYear: number,
  competenceMonth: number,
) {
  const adapter = getDatabaseAdapter();
  const value = await adapter.queryValue(
    `
      SELECT COUNT(*)
      FROM membership_fee_payments
      WHERE associate_id = ?
        AND competence_year = ?
        AND competence_month = ?
    `,
    [associateId, competenceYear, competenceMonth],
  );

  return Number(value);
}

async function queryDuplicateGeneratedAlertsCount() {
  const adapter = getDatabaseAdapter();
  const rows = await adapter.query(
    `
      SELECT COUNT(*)
      FROM (
        SELECT source_document_id
        FROM alerts
        WHERE kind = 'document_expiration'
          AND source_document_id IS NOT NULL
        GROUP BY source_document_id
        HAVING COUNT(*) > 1
      ) duplicates
    `,
  );

  return Number(rows[0]?.[0] ?? 0);
}

async function createStressAssociates(count: number) {
  const associateService = createAssociateService();
  const createdIds: string[] = [];

  for (let index = 0; index < count; index += 1) {
    const created = await associateService.createAssociate({
      name: `QA Operador ${String(index + 1).padStart(2, "0")}`,
      cpf: buildValidCpf(1_000 + index),
      category: "Titular",
      registrationNumber: `QA-POOL-${String(index + 1).padStart(4, "0")}`,
      status: "Ativo",
      admissionDate: "2026-01-10",
      modalidadeAssociado: index % 2 === 0 ? "TAXI" : "CAMINHAO",
      telefone: `1997000${String(index).padStart(4, "0")}`,
    });

    createdIds.push(created.id);
  }

  return createdIds;
}

async function seedDocumentsForAlertReconciliation(associateIds: string[], count: number) {
  for (let index = 0; index < count; index += 1) {
    const associateId = associateIds[index % associateIds.length];
    const documentType = documentTypes[index % documentTypes.length] as DocumentType;
    const day = String((index % 28) + 1).padStart(2, "0");

    await createDocumentWithAlerts({
      associateId,
      documentType,
      dueDate: `2025-02-${day}`,
      owner: `seed-alert-${index + 1}`,
      notes: `Seed alert document ${index + 1}`,
    });
  }
}

async function prepareScenario(extraAssociates = 12): Promise<ScenarioContext> {
  await resetSqliteStorageState();
  await resetSqliteDatabase({ seed: true });
  const stressAssociateIds = await createStressAssociates(extraAssociates);
  const associateIds = await queryAssociateIds(40);

  return {
    associateIds,
    stressAssociateIds,
  };
}

async function runSameProcessAssociates(): Promise<ScenarioSummary> {
  await prepareScenario(8);
  const associateService = createAssociateService();
  const before = await queryCountSnapshot();
  const startedAt = performance.now();
  const operations = Array.from({ length: 24 }, (_, index) =>
    measureOperation(() =>
      associateService.createAssociate({
        name: `Concorrente Interno ${String(index + 1).padStart(2, "0")}`,
        cpf: buildValidCpf(2_000 + index),
        category: "Titular",
        registrationNumber: `QA-CONC-${String(index + 1).padStart(4, "0")}`,
        status: "Ativo",
        admissionDate: "2026-02-01",
        modalidadeAssociado: index % 3 === 0 ? "ESCOLAR" : "TAXI",
        telefone: `1997100${String(index).padStart(4, "0")}`,
      }),
    ),
  );
  const outcomes = await Promise.all(operations);
  const wallTimeMs = performance.now() - startedAt;
  const after = await queryCountSnapshot();
  const successfulCreates = outcomes.filter((outcome) => outcome.ok).length;
  const consistency: string[] = [];

  consistency.push(
    after.associates - before.associates === successfulCreates
      ? "OK: contagem de associados criada bate com os sucessos."
      : `FALHA: esperados ${successfulCreates} associados, encontrados ${after.associates - before.associates}.`,
  );

  return summarizeOperationOutcomes(
    "same-process-associates",
    outcomes,
    wallTimeMs,
    consistency,
  );
}

async function runSameProcessDocuments(): Promise<ScenarioSummary> {
  const context = await prepareScenario(10);
  const before = await queryCountSnapshot();
  const startedAt = performance.now();
  const operations = Array.from({ length: 36 }, (_, index) => {
    const associateIndex = Math.floor(index / documentTypes.length);
    const documentTypeIndex = index % documentTypes.length;

    return measureOperation(() =>
      createDocumentWithAlerts({
        associateId: context.associateIds[associateIndex]!,
        documentType: documentTypes[documentTypeIndex] as DocumentType,
        dueDate: `2025-03-${String((index % 28) + 1).padStart(2, "0")}`,
        owner: `same-process-doc-${index + 1}`,
        notes: `Documento concorrente ${index + 1}`,
      }),
    );
  });
  const outcomes = await Promise.all(operations);
  const wallTimeMs = performance.now() - startedAt;
  const after = await queryCountSnapshot();
  const successfulCreates = outcomes.filter((outcome) => outcome.ok).length;
  const duplicateAlerts = await queryDuplicateGeneratedAlertsCount();
  const consistency: string[] = [];

  consistency.push(
    after.documents - before.documents === successfulCreates
      ? "OK: documentos persistidos correspondem aos sucessos."
      : `FALHA: esperados ${successfulCreates} documentos, encontrados ${after.documents - before.documents}.`,
  );
  consistency.push(
    duplicateAlerts === 0
      ? "OK: nenhum alerta documental duplicado por source_document_id."
      : `FALHA: ${duplicateAlerts} duplicidades de alertas documentais detectadas.`,
  );

  return summarizeOperationOutcomes(
    "same-process-documents",
    outcomes,
    wallTimeMs,
    consistency,
  );
}

async function runSameProcessMembershipDistinct(): Promise<ScenarioSummary> {
  const context = await prepareScenario(6);
  const membershipService = createMembershipFeeService();
  const targetAssociateId = context.stressAssociateIds[0]!;
  const before = await queryCountSnapshot();
  const startedAt = performance.now();
  const operations = Array.from({ length: 6 }, (_, index) =>
    measureOperation(() =>
      membershipService.confirmMembershipPayment(
        {
          associateId: targetAssociateId,
          competenceYear: 2026,
          competenceMonth: index + 1,
          notes: `Pagamento distinto ${index + 1}`,
        },
        FIXED_NOW,
      ),
    ),
  );
  const outcomes = await Promise.all(operations);
  const wallTimeMs = performance.now() - startedAt;
  const after = await queryCountSnapshot();
  const successfulPayments = outcomes.filter((outcome) => outcome.ok).length;
  const consistency = [
    after.payments - before.payments === successfulPayments
      ? "OK: pagamentos distintos persistidos corretamente."
      : `FALHA: esperados ${successfulPayments} pagamentos, encontrados ${after.payments - before.payments}.`,
  ];

  return summarizeOperationOutcomes(
    "same-process-membership-distinct",
    outcomes,
    wallTimeMs,
    consistency,
  );
}

async function runSameProcessMembershipDuplicate(): Promise<ScenarioSummary> {
  const context = await prepareScenario(6);
  const membershipService = createMembershipFeeService();
  const targetAssociateId = context.stressAssociateIds[1]!;
  const startedAt = performance.now();
  const operations = Array.from({ length: 6 }, () =>
    measureOperation(() =>
      membershipService.confirmMembershipPayment(
        {
          associateId: targetAssociateId,
          competenceYear: 2026,
          competenceMonth: 7,
          notes: "Tentativa concorrente da mesma competencia",
        },
        FIXED_NOW,
      ),
    ),
  );
  const outcomes = await Promise.all(operations);
  const wallTimeMs = performance.now() - startedAt;
  const paymentCount = await queryPaymentCountByCompetence(targetAssociateId, 2026, 7);
  const consistency = [
    paymentCount === 1
      ? "OK: somente um pagamento persistido para a mesma competencia."
      : `FALHA: ${paymentCount} pagamentos persistidos para a mesma competencia.`,
  ];

  return summarizeOperationOutcomes(
    "same-process-membership-duplicate",
    outcomes,
    wallTimeMs,
    consistency,
  );
}

async function spawnWorker(
  workerKind: WorkerKind,
  workerId: number,
  options: {
    count?: number;
    associateIds?: string[];
    targetAssociateId?: string;
    competenceYear?: number;
    competenceMonth?: number;
    startIndex?: number;
  },
): Promise<WorkerSummary> {
  const args = [
    "--import",
    "tsx",
    resolve(SCRIPT_DIR, "qa-operational-simulation.ts"),
    "--worker",
    `--worker-kind=${workerKind}`,
    `--worker-id=${workerId}`,
  ];

  if (typeof options.count === "number") {
    args.push(`--count=${options.count}`);
  }

  if (options.associateIds) {
    args.push(`--associate-ids=${JSON.stringify(options.associateIds)}`);
  }

  if (options.targetAssociateId) {
    args.push(`--target-associate-id=${options.targetAssociateId}`);
  }

  if (typeof options.competenceYear === "number") {
    args.push(`--competence-year=${options.competenceYear}`);
  }

  if (typeof options.competenceMonth === "number") {
    args.push(`--competence-month=${options.competenceMonth}`);
  }

  if (typeof options.startIndex === "number") {
    args.push(`--start-index=${options.startIndex}`);
  }

  return new Promise<WorkerSummary>((resolvePromise, rejectPromise) => {
    const child = spawn(process.execPath, args, {
      cwd: process.cwd(),
      env: {
        ...process.env,
        E2E_TEST_MODE: "true",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdoutBuffer = "";
    let stderrBuffer = "";

    child.stdout.on("data", (chunk) => {
      stdoutBuffer += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderrBuffer += chunk.toString();
    });

    child.on("error", rejectPromise);
    child.on("close", (code) => {
      const resultLine = stdoutBuffer
        .split(/\r?\n/u)
        .map((line) => line.trim())
        .filter(Boolean)
        .find((line) => line.startsWith("__RESULT__"));

      if (code !== 0 || !resultLine) {
        rejectPromise(
          new Error(
            `WORKER_FAILED kind=${workerKind} id=${workerId} code=${code}\nstdout:\n${stdoutBuffer}\nstderr:\n${stderrBuffer}`,
          ),
        );
        return;
      }

      resolvePromise(JSON.parse(resultLine.replace("__RESULT__", "")) as WorkerSummary);
    });
  });
}

function aggregateWorkerSummaries(
  name: ScenarioKind,
  workers: WorkerSummary[],
  wallTimeMs: number,
  consistency: string[],
): ScenarioSummary {
  const outcomes: OperationOutcome[] = [];

  for (const worker of workers) {
    for (const durationMs of worker.durationsMs) {
      outcomes.push({
        ok: true,
        busy: false,
        conflict: false,
        durationMs,
      });
    }
  }

  let successOps = 0;
  let busyErrors = 0;
  let conflictErrors = 0;
  let otherErrors = 0;
  const durations: number[] = [];

  for (const worker of workers) {
    successOps += worker.successOps;
    busyErrors += worker.busyErrors;
    conflictErrors += worker.conflictErrors;
    otherErrors += worker.otherErrors;
    durations.push(...worker.durationsMs);
  }

  const totalOps = successOps + busyErrors + conflictErrors + otherErrors;
  const sortedDurations = durations.sort((left, right) => left - right);
  const totalDuration = sortedDurations.reduce((sum, value) => sum + value, 0);
  const p95Index =
    sortedDurations.length === 0
      ? 0
      : Math.max(0, Math.ceil(sortedDurations.length * 0.95) - 1);

  return {
    name,
    totalOps,
    successOps,
    busyErrors,
    conflictErrors,
    otherErrors,
    wallTimeMs,
    avgOpMs:
      sortedDurations.length === 0 ? 0 : totalDuration / sortedDurations.length,
    p95OpMs: sortedDurations[p95Index] ?? 0,
    maxOpMs: sortedDurations[sortedDurations.length - 1] ?? 0,
    consistency,
  };
}

async function runCrossProcessAssociates(): Promise<ScenarioSummary> {
  await prepareScenario(6);
  const before = await queryCountSnapshot();
  const startedAt = performance.now();
  const workers = await Promise.all(
    Array.from({ length: 4 }, (_, workerIndex) =>
      spawnWorker("associate-create", workerIndex + 1, { count: 12 }),
    ),
  );
  const wallTimeMs = performance.now() - startedAt;
  const after = await queryCountSnapshot();
  const successOps = workers.reduce((sum, worker) => sum + worker.successOps, 0);
  const consistency = [
    after.associates - before.associates === successOps
      ? "OK: criacoes cross-process persistidas sem perda aparente."
      : `FALHA: esperados ${successOps} associados, encontrados ${after.associates - before.associates}.`,
  ];

  return aggregateWorkerSummaries(
    "cross-process-associates",
    workers,
    wallTimeMs,
    consistency,
  );
}

async function runCrossProcessDocuments(): Promise<ScenarioSummary> {
  const context = await prepareScenario(10);
  const before = await queryCountSnapshot();
  const startedAt = performance.now();
  const workers = await Promise.all(
    Array.from({ length: 4 }, (_, workerIndex) =>
      spawnWorker("document-create", workerIndex + 1, {
        count: 15,
        associateIds: context.associateIds.slice(0, 12),
        startIndex: workerIndex * 15,
      }),
    ),
  );
  const wallTimeMs = performance.now() - startedAt;
  const after = await queryCountSnapshot();
  const duplicateAlerts = await queryDuplicateGeneratedAlertsCount();
  const successOps = workers.reduce((sum, worker) => sum + worker.successOps, 0);
  const consistency = [
    after.documents - before.documents === successOps
      ? "OK: documentos cross-process persistidos corretamente."
      : `FALHA: esperados ${successOps} documentos, encontrados ${after.documents - before.documents}.`,
    duplicateAlerts === 0
      ? "OK: sem duplicidade de alertas gerados por documento."
      : `FALHA: ${duplicateAlerts} duplicidades de alertas gerados detectadas.`,
  ];

  return aggregateWorkerSummaries(
    "cross-process-documents",
    workers,
    wallTimeMs,
    consistency,
  );
}

async function runCrossProcessAlerts(): Promise<ScenarioSummary> {
  const context = await prepareScenario(10);
  await seedDocumentsForAlertReconciliation(context.associateIds.slice(0, 10), 36);
  const before = await queryCountSnapshot();
  const startedAt = performance.now();
  const workers = await Promise.all(
    Array.from({ length: 4 }, (_, workerIndex) =>
      spawnWorker("alert-reconcile", workerIndex + 1, { count: 5 }),
    ),
  );
  const wallTimeMs = performance.now() - startedAt;
  const after = await queryCountSnapshot();
  const duplicateAlerts = await queryDuplicateGeneratedAlertsCount();
  const consistency = [
    after.generatedAlerts >= before.generatedAlerts
      ? "OK: reconciliacao preservou/atualizou alertas gerados sem limpeza indevida."
      : `FALHA: alertas gerados cairam de ${before.generatedAlerts} para ${after.generatedAlerts}.`,
    duplicateAlerts === 0
      ? "OK: reconciliacao manteve unicidade por source_document_id."
      : `FALHA: ${duplicateAlerts} duplicidades de alertas apos reconciliacao.`,
  ];

  return aggregateWorkerSummaries(
    "cross-process-alerts",
    workers,
    wallTimeMs,
    consistency,
  );
}

async function runCrossProcessMembershipDuplicate(): Promise<ScenarioSummary> {
  const context = await prepareScenario(8);
  const targetAssociateId = context.stressAssociateIds[2]!;
  const startedAt = performance.now();
  const workers = await Promise.all(
    Array.from({ length: 6 }, (_, workerIndex) =>
      spawnWorker("membership-duplicate", workerIndex + 1, {
        targetAssociateId,
        competenceYear: 2026,
        competenceMonth: 9,
      }),
    ),
  );
  const wallTimeMs = performance.now() - startedAt;
  const paymentCount = await queryPaymentCountByCompetence(targetAssociateId, 2026, 9);
  const consistency = [
    paymentCount === 1
      ? "OK: cross-process preservou unicidade do pagamento por competencia."
      : `FALHA: ${paymentCount} pagamentos persistidos para a mesma competencia.`,
  ];

  return aggregateWorkerSummaries(
    "cross-process-membership-duplicate",
    workers,
    wallTimeMs,
    consistency,
  );
}

async function runWorker() {
  const workerKind = getFlagValue("worker-kind") as WorkerKind | null;
  const workerId = Number(getFlagValue("worker-id") ?? "0");
  const count = Number(getFlagValue("count") ?? "1");
  const associateIds = parseJsonFlag<string[]>("associate-ids") ?? [];
  const targetAssociateId = getFlagValue("target-associate-id");
  const competenceYear = Number(getFlagValue("competence-year") ?? "2026");
  const competenceMonth = Number(getFlagValue("competence-month") ?? "1");
  const startIndex = Number(getFlagValue("start-index") ?? "0");
  const associateService = createAssociateService();
  const membershipService = createMembershipFeeService();
  const outcomes: OperationOutcome[] = [];
  const startedAt = performance.now();

  if (!workerKind) {
    throw new Error("WORKER_KIND_REQUIRED");
  }

  switch (workerKind) {
    case "associate-create":
      for (let index = 0; index < count; index += 1) {
        outcomes.push(
          await measureOperation(() =>
            associateService.createAssociate({
              name: `Worker ${workerId} Associado ${String(index + 1).padStart(2, "0")}`,
              cpf: buildValidCpf(workerId * 10_000 + index + 1),
              category: "Titular",
              registrationNumber: `QA-W${workerId}-${String(index + 1).padStart(4, "0")}`,
              status: "Ativo",
              admissionDate: "2026-02-15",
              modalidadeAssociado: index % 2 === 0 ? "ESCOLAR" : "CAMINHAO",
              telefone: `199720${String(workerId).padStart(2, "0")}${String(index).padStart(4, "0")}`,
            }),
          ),
        );
      }
      break;
    case "document-create":
      for (let index = 0; index < count; index += 1) {
        const globalIndex = startIndex + index;
        const associateIndex = Math.floor(globalIndex / documentTypes.length);
        const documentTypeIndex = globalIndex % documentTypes.length;

        outcomes.push(
          await measureOperation(() =>
            createDocumentWithAlerts({
              associateId: associateIds[associateIndex % associateIds.length]!,
              documentType: documentTypes[documentTypeIndex] as DocumentType,
              dueDate: `2025-04-${String((index % 28) + 1).padStart(2, "0")}`,
              owner: `worker-doc-${workerId}`,
              notes: `worker ${workerId} doc ${index + 1}`,
            }),
          ),
        );
      }
      break;
    case "alert-reconcile":
      for (let index = 0; index < count; index += 1) {
        outcomes.push(
          await measureOperation(() =>
            reconcileDocumentExpirationAlerts({
              now: FIXED_NOW,
            }),
          ),
        );
      }
      break;
    case "membership-duplicate":
      outcomes.push(
        await measureOperation(() =>
          membershipService.confirmMembershipPayment(
            {
              associateId: targetAssociateId ?? "",
              competenceYear,
              competenceMonth,
              notes: `worker-${workerId}`,
            },
            FIXED_NOW,
          ),
        ),
      );
      break;
    default:
      throw new Error(`WORKER_KIND_UNSUPPORTED:${workerKind satisfies never}`);
  }

  const wallTimeMs = performance.now() - startedAt;
  const summary: WorkerSummary = {
    workerKind,
    workerId,
    totalOps: outcomes.length,
    successOps: outcomes.filter((outcome) => outcome.ok).length,
    busyErrors: outcomes.filter((outcome) => outcome.busy).length,
    conflictErrors: outcomes.filter((outcome) => outcome.conflict).length,
    otherErrors: outcomes.filter(
      (outcome) => !outcome.ok && !outcome.busy && !outcome.conflict,
    ).length,
    wallTimeMs,
    durationsMs: outcomes.map((outcome) => outcome.durationMs),
  };

  console.log(`__RESULT__${JSON.stringify(summary)}`);
}

function formatMs(value: number) {
  return `${value.toFixed(1)} ms`;
}

function printScenario(summary: ScenarioSummary) {
  console.log(`\n[${summary.name}]`);
  console.log(
    `ops=${summary.totalOps} success=${summary.successOps} conflicts=${summary.conflictErrors} busy=${summary.busyErrors} other=${summary.otherErrors}`,
  );
  console.log(
    `wall=${formatMs(summary.wallTimeMs)} avg=${formatMs(summary.avgOpMs)} p95=${formatMs(summary.p95OpMs)} max=${formatMs(summary.maxOpMs)}`,
  );

  for (const line of summary.consistency) {
    console.log(`- ${line}`);
  }
}

async function runMain() {
  console.log("DocFleet operational concurrency simulation");
  console.log("Database target: .e2e/app.db (isolated)");

  const scenarios: ScenarioSummary[] = [];

  scenarios.push(await runSameProcessAssociates());
  scenarios.push(await runSameProcessDocuments());
  scenarios.push(await runSameProcessMembershipDistinct());
  scenarios.push(await runSameProcessMembershipDuplicate());
  scenarios.push(await runCrossProcessAssociates());
  scenarios.push(await runCrossProcessDocuments());
  scenarios.push(await runCrossProcessAlerts());
  scenarios.push(await runCrossProcessMembershipDuplicate());

  for (const scenario of scenarios) {
    printScenario(scenario);
  }

  const totalBusy = scenarios.reduce((sum, scenario) => sum + scenario.busyErrors, 0);
  const totalOtherErrors = scenarios.reduce(
    (sum, scenario) => sum + scenario.otherErrors,
    0,
  );
  const maxP95 = Math.max(...scenarios.map((scenario) => scenario.p95OpMs));

  console.log("\nOperational summary");
  console.log(
    `- Busy errors detectados: ${totalBusy}`,
  );
  console.log(
    `- Outros erros inesperados: ${totalOtherErrors}`,
  );
  console.log(
    `- P95 mais alto entre os cenarios: ${formatMs(maxP95)}`,
  );
}

async function main() {
  if (process.argv.includes("--worker")) {
    await runWorker();
    return;
  }

  await runMain();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

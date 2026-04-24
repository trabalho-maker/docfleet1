import bcrypt from "bcryptjs";
import { SqliteUserRepository } from "@/features/data/repositories/user-repository";
import { SqliteDocumentRepository } from "@/features/data/repositories/document-repository";
import { SqliteAlertRepository } from "@/features/data/repositories/alert-repository";
import { SqlitePasswordResetTokenRepository } from "@/features/data/repositories/password-reset-token-repository";
import { SqliteAuthRateLimitRepository } from "@/features/data/repositories/auth-rate-limit-repository";
import {
  resetSqliteDatabase,
  resetSqliteStorageState,
  withSqliteWriteLock,
} from "@/lib/storage/sqlite-storage";
import { createSqliteSchema } from "@/lib/storage/sqlite-schema";

describe("repositories", () => {
  const userRepository = new SqliteUserRepository();
  const documentRepository = new SqliteDocumentRepository();
  const alertRepository = new SqliteAlertRepository();
  const passwordResetTokenRepository = new SqlitePasswordResetTokenRepository();
  const authRateLimitRepository = new SqliteAuthRateLimitRepository();

  beforeEach(async () => {
    await resetSqliteStorageState();
    await resetSqliteDatabase();
  });

  afterAll(async () => {
    await resetSqliteStorageState();
  });

  it("creates a user with normalized email and hashed password", async () => {
    const user = await userRepository.create({
      name: "Maria da Silva",
      email: " Maria@DocFleet.Local ",
      password: "Senha123",
    });

    expect(user.email).toBe("maria@docfleet.local");
    expect(user.role).toBe("Operador");
    expect(user.passwordHash).not.toBe("Senha123");
    await expect(bcrypt.compare("Senha123", user.passwordHash)).resolves.toBe(
      true,
    );
  });

  it("rejects duplicate users by email", async () => {
    await expect(
      userRepository.create({
        name: "Outro Usuario",
        email: "operacoes@docfleet.local",
        password: "Senha123",
      }),
    ).rejects.toThrow("USER_ALREADY_EXISTS");
  });

  it("returns structured documents ordered by due date", async () => {
    const documents = await documentRepository.listRecent();
    const allDocuments = await documentRepository.listAll();
    const totalDocuments = await documentRepository.countAll();
    const pendingDocuments = await documentRepository.countPending();

    expect(documents).toHaveLength(3);
    expect(allDocuments).toHaveLength(3);
    expect(documents.map((item) => item.id)).toEqual([
      "doc_03",
      "doc_01",
      "doc_02",
    ]);
    expect(documents[0]).toMatchObject({
      documentType: "AUTORIZACAO_CONDUTOR",
      associateId: "asc_03",
      associateCategory: "CAMINHAO",
    });
    expect(totalDocuments).toBe(3);
    expect(pendingDocuments).toBe(2);
  });

  it("filters structured documents by associate category", async () => {
    const taxistaDocuments = await documentRepository.listAll({
      category: "TAXI",
    });

    expect(taxistaDocuments).toHaveLength(1);
    expect(taxistaDocuments[0]).toMatchObject({
      id: "doc_01",
      associateId: "asc_01",
      documentType: "CNH",
      associateCategory: "TAXI",
    });
  });

  it("consolidates legacy duplicates before enforcing associate/type uniqueness", async () => {
    await withSqliteWriteLock(async (db) => {
      db.run("DROP TABLE IF EXISTS documents");
      db.run(`
        CREATE TABLE documents (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          owner TEXT NOT NULL,
          type TEXT NOT NULL,
          status TEXT NOT NULL,
          due_date TEXT NOT NULL,
          associate_id TEXT,
          notes TEXT
        )
      `);
      db.run(
        `INSERT INTO documents (
          id,
          name,
          owner,
          type,
          status,
          due_date,
          associate_id,
          notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "legacy_doc_old",
          "CNH",
          "Equipe A",
          "CNH",
          "Atencao",
          "2026-05-01",
          "asc_01",
          "",
        ],
      );
      db.run(
        `INSERT INTO documents (
          id,
          name,
          owner,
          type,
          status,
          due_date,
          associate_id,
          notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "legacy_doc_new",
          "CNH",
          "Equipe B",
          "CNH",
          "Valido",
          "2026-06-01",
          "asc_01",
          "Registro mais completo.",
        ],
      );

      createSqliteSchema(db);
    });

    const deduplicated = await documentRepository.findByAssociateAndType("asc_01", "CNH");
    const rows = await documentRepository.findByAssociateId("asc_01", {
      documentTypes: ["CNH"],
    });

    expect(rows).toHaveLength(1);
    expect(deduplicated).toMatchObject({
      id: "legacy_doc_new",
      owner: "Equipe B",
      dueDate: "2026-06-01",
      notes: "Registro mais completo.",
    });
  });

  it("creates, updates and deletes a structured document linked to an associate", async () => {
    const created = await documentRepository.create({
      associateId: "asc_01",
      documentType: "TACOGRAFO",
      dueDate: "2099-05-10",
      owner: "Equipe Financeira",
      notes: "Primeiro cadastro estruturado.",
    });

    expect(created.documentType).toBe("TACOGRAFO");
    expect(created.associateId).toBe("asc_01");
    expect(created.status).toBe("Valido");

    const found = await documentRepository.findByAssociateAndType("asc_01", "TACOGRAFO");

    expect(found).not.toBeNull();
    expect(found?.owner).toBe("Equipe Financeira");
    expect(found?.associateName).toBe("Maria de Souza");

    const updated = await documentRepository.update(created.id, {
      dueDate: "2000-06-10",
      notes: "Documento vencido para teste.",
    });

    expect(updated.status).toBe("Vencido");
    expect(updated.notes).toBe("Documento vencido para teste.");

    await documentRepository.delete(created.id);

    const afterDelete = await documentRepository.findById(created.id);

    expect(afterDelete).toBeNull();
  });

  it("upserts an existing associate document instead of creating duplicates", async () => {
    const upserted = await documentRepository.create({
      associateId: "asc_01",
      documentType: "CNH",
      dueDate: "2099-08-15",
      owner: "Equipe de Cadastro",
      notes: "Atualizacao via upsert.",
    });
    const rows = await documentRepository.findByAssociateId("asc_01", {
      documentTypes: ["CNH"],
    });

    expect(rows).toHaveLength(1);
    expect(upserted).toMatchObject({
      id: "doc_01",
      owner: "Equipe de Cadastro",
      dueDate: "2099-08-15",
      notes: "Atualizacao via upsert.",
    });
  });

  it("returns alerts ordered by most recent timestamp", async () => {
    const alerts = await alertRepository.listOpen();
    const totalAlerts = await alertRepository.countOpen();

    expect(alerts).toHaveLength(3);
    expect(alerts.map((item) => item.id)).toEqual([
      "alt_03",
      "alt_02",
      "alt_01",
    ]);
    expect(totalAlerts).toBe(3);
  });

  it("creates and resolves a valid password reset token", async () => {
    const seededUser = await userRepository.findByEmail("operacoes@docfleet.local");

    expect(seededUser).not.toBeNull();

    const created = await passwordResetTokenRepository.createForUser(seededUser!);
    const resolved = await passwordResetTokenRepository.findValidByRawToken(
      created.token,
    );

    expect(resolved).not.toBeNull();
    expect(resolved?.user.email).toBe("operacoes@docfleet.local");
  });

  it("allows multiple active password reset tokens to coexist for the same user", async () => {
    const seededUser = await userRepository.findByEmail("operacoes@docfleet.local");

    expect(seededUser).not.toBeNull();

    const first = await passwordResetTokenRepository.createForUser(seededUser!);
    const second = await passwordResetTokenRepository.createForUser(seededUser!);

    const firstResolved = await passwordResetTokenRepository.findValidByRawToken(
      first.token,
    );
    const secondResolved = await passwordResetTokenRepository.findValidByRawToken(
      second.token,
    );

    expect(firstResolved).not.toBeNull();
    expect(secondResolved).not.toBeNull();
    expect(firstResolved?.id).not.toBe(secondResolved?.id);
  });

  it("consumes a password reset token after use", async () => {
    const seededUser = await userRepository.findByEmail("operacoes@docfleet.local");
    const created = await passwordResetTokenRepository.createForUser(seededUser!);
    const resolved = await passwordResetTokenRepository.findValidByRawToken(
      created.token,
    );

    expect(resolved).not.toBeNull();

    await passwordResetTokenRepository.consume(resolved!.id);

    const afterConsume = await passwordResetTokenRepository.findValidByRawToken(
      created.token,
    );

    expect(afterConsume).toBeNull();
  });

  it("can invalidate all remaining active reset tokens after one is used successfully", async () => {
    const seededUser = await userRepository.findByEmail("operacoes@docfleet.local");
    const first = await passwordResetTokenRepository.createForUser(seededUser!);
    const second = await passwordResetTokenRepository.createForUser(seededUser!);
    const resolvedFirst = await passwordResetTokenRepository.findValidByRawToken(
      first.token,
    );

    expect(resolvedFirst).not.toBeNull();

    await passwordResetTokenRepository.consume(resolvedFirst!.id);
    await passwordResetTokenRepository.deleteActiveForUser(seededUser!.id);

    const firstAfter = await passwordResetTokenRepository.findValidByRawToken(
      first.token,
    );
    const secondAfter = await passwordResetTokenRepository.findValidByRawToken(
      second.token,
    );

    expect(firstAfter).toBeNull();
    expect(secondAfter).toBeNull();
  });

  it("blocks login after multiple failed attempts", async () => {
    const policy = {
      windowMs: 15 * 60 * 1000,
      maxAttempts: 3,
      baseBlockDurationMs: 15 * 60 * 1000,
      maxBlockDurationMs: 15 * 60 * 1000,
    };

    await authRateLimitRepository.registerFailure(
      "login",
      "teste@docfleet.local",
      policy,
    );
    await authRateLimitRepository.registerFailure(
      "login",
      "teste@docfleet.local",
      policy,
    );
    const blocked = await authRateLimitRepository.registerFailure(
      "login",
      "teste@docfleet.local",
      policy,
    );

    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked.penaltyLevel).toBe(1);
  });

  it("clears login rate limit state after success path", async () => {
    const policy = {
      windowMs: 15 * 60 * 1000,
      maxAttempts: 3,
      baseBlockDurationMs: 15 * 60 * 1000,
      maxBlockDurationMs: 15 * 60 * 1000,
    };

    await authRateLimitRepository.registerFailure(
      "login",
      "teste@docfleet.local",
      policy,
    );
    await authRateLimitRepository.clear("login", "teste@docfleet.local");
    const state = await authRateLimitRepository.getState(
      "login",
      "teste@docfleet.local",
      policy,
    );

    expect(state.allowed).toBe(true);
    expect(state.attemptsRemaining).toBe(policy.maxAttempts);
  });

  it("applies progressive blocking with capped backoff without causing permanent lockout", async () => {
    const identifier = "progressive@docfleet.local";
    const policy = {
      windowMs: 60 * 1000,
      maxAttempts: 2,
      baseBlockDurationMs: 1000,
      maxBlockDurationMs: 4000,
    };

    await authRateLimitRepository.registerFailure("login", identifier, policy);
    const firstBlocked = await authRateLimitRepository.registerFailure(
      "login",
      identifier,
      policy,
    );

    expect(firstBlocked.allowed).toBe(false);
    expect(firstBlocked.penaltyLevel).toBe(1);

    await withSqliteWriteLock(async (db) => {
      db.run(
        `UPDATE auth_rate_limits
         SET blocked_until = ?, window_started_at = ?
         WHERE scope = ? AND identifier = ?`,
        [
          new Date(Date.now() - 1000).toISOString(),
          new Date(Date.now() - policy.windowMs - 1000).toISOString(),
          "login",
          identifier,
        ],
      );
    });

    await authRateLimitRepository.registerFailure("login", identifier, policy);
    const secondBlocked = await authRateLimitRepository.registerFailure(
      "login",
      identifier,
      policy,
    );

    expect(secondBlocked.allowed).toBe(false);
    expect(secondBlocked.penaltyLevel).toBe(2);
    expect(secondBlocked.retryAfterSeconds).toBeGreaterThanOrEqual(
      firstBlocked.retryAfterSeconds,
    );

    await withSqliteWriteLock(async (db) => {
      db.run(
        `UPDATE auth_rate_limits
         SET blocked_until = ?, window_started_at = ?
         WHERE scope = ? AND identifier = ?`,
        [
          new Date(Date.now() - 1000).toISOString(),
          new Date(Date.now() - policy.windowMs - 1000).toISOString(),
          "login",
          identifier,
        ],
      );
    });

    const recoveredState = await authRateLimitRepository.getState(
      "login",
      identifier,
      policy,
    );

    expect(recoveredState.allowed).toBe(true);
    expect(recoveredState.attemptsRemaining).toBe(policy.maxAttempts);
    expect(recoveredState.penaltyLevel).toBe(2);
  });
});

import bcrypt from "bcryptjs";
import { SqliteUserRepository } from "@/features/data/repositories/user-repository";
import { SqliteDocumentRepository } from "@/features/data/repositories/document-repository";
import { SqliteAlertRepository } from "@/features/data/repositories/alert-repository";
import { SqlitePasswordResetTokenRepository } from "@/features/data/repositories/password-reset-token-repository";
import { SqliteAuthRateLimitRepository } from "@/features/data/repositories/auth-rate-limit-repository";
import {
  resetSqliteDatabase,
  resetSqliteStorageState,
} from "@/lib/storage/sqlite-storage";

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

  it("returns documents ordered by due date", async () => {
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
    expect(totalDocuments).toBe(3);
    expect(pendingDocuments).toBe(2);
  });

  it("creates, updates and deletes a document", async () => {
    const created = await documentRepository.create({
      name: "Seguro da frota pesada",
      type: "Seguros",
      dueDate: "2026-05-10",
      status: "A vencer",
      owner: "Equipe Financeira",
    });

    expect(created.title).toBe("Seguro da frota pesada");
    expect(created.category).toBe("Seguros");

    const found = await documentRepository.findById(created.id);

    expect(found).not.toBeNull();
    expect(found?.owner).toBe("Equipe Financeira");

    const updated = await documentRepository.update(created.id, {
      name: "Seguro da frota pesada - renovado",
      type: "Seguros",
      dueDate: "2026-06-10",
      status: "Em dia",
    });

    expect(updated.title).toBe("Seguro da frota pesada - renovado");
    expect(updated.status).toBe("Em dia");

    const afterUpdate = await documentRepository.findById(created.id);

    expect(afterUpdate?.dueDate).toBe("2026-06-10");

    await documentRepository.delete(created.id);

    const afterDelete = await documentRepository.findById(created.id);

    expect(afterDelete).toBeNull();
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
      blockDurationMs: 15 * 60 * 1000,
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
  });

  it("clears login rate limit state after success path", async () => {
    const policy = {
      windowMs: 15 * 60 * 1000,
      maxAttempts: 3,
      blockDurationMs: 15 * 60 * 1000,
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
});

import bcrypt from "bcryptjs";
import { SqliteUserRepository } from "@/features/data/repositories/user-repository";
import { LocalDocumentRepository } from "@/features/data/repositories/document-repository";
import { LocalAlertRepository } from "@/features/data/repositories/alert-repository";
import { SqlitePasswordResetTokenRepository } from "@/features/data/repositories/password-reset-token-repository";
import { SqliteAuthRateLimitRepository } from "@/features/data/repositories/auth-rate-limit-repository";
import {
  resetSqliteDatabase,
  resetSqliteStorageState,
} from "@/lib/storage/sqlite-storage";

describe("repositories", () => {
  const userRepository = new SqliteUserRepository();
  const documentRepository = new LocalDocumentRepository();
  const alertRepository = new LocalAlertRepository();
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

    expect(documents).toHaveLength(3);
    expect(documents.map((item) => item.id)).toEqual([
      "doc_03",
      "doc_01",
      "doc_02",
    ]);
  });

  it("returns alerts ordered by most recent timestamp", async () => {
    const alerts = await alertRepository.listOpen();

    expect(alerts).toHaveLength(3);
    expect(alerts.map((item) => item.id)).toEqual([
      "alt_03",
      "alt_02",
      "alt_01",
    ]);
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

import {
  assertLoginAllowed,
  AuthRateLimitError,
  clearLoginAttempts,
  consumePasswordResetAttempt,
  registerFailedLoginAttempt,
} from "@/features/auth/server/security";
import {
  resetSqliteDatabase,
  resetSqliteStorageState,
} from "@/lib/storage/sqlite-storage";

describe("auth security helpers", () => {
  const testIpAddress = "203.0.113.10";

  beforeEach(async () => {
    await resetSqliteStorageState();
    await resetSqliteDatabase();
  });

  afterAll(async () => {
    await resetSqliteStorageState();
  });

  it("blocks login after reaching the configured failed-attempt limit for the same email", async () => {
    const identifier = "OPERACOES@DOCFLEET.LOCAL";

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await registerFailedLoginAttempt(identifier, testIpAddress);
    }

    await expect(
      assertLoginAllowed(" operacoes@docfleet.local ", testIpAddress),
    ).rejects.toMatchObject<
      Partial<AuthRateLimitError>
    >({
      name: "AuthRateLimitError",
    });
  });

  it("blocks login after suspicious attempts from the same IP across multiple emails", async () => {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      await registerFailedLoginAttempt(`usuario${attempt}@docfleet.local`, testIpAddress);
    }

    await expect(
      assertLoginAllowed("novo-usuario@docfleet.local", testIpAddress),
    ).rejects.toMatchObject<Partial<AuthRateLimitError>>({
      name: "AuthRateLimitError",
    });
  });

  it("clears login attempts using the normalized identifier and IP address", async () => {
    await registerFailedLoginAttempt("OPERACOES@DOCFLEET.LOCAL", testIpAddress);
    await clearLoginAttempts(" operacoes@docfleet.local ", testIpAddress);

    await expect(
      assertLoginAllowed("operacoes@docfleet.local", testIpAddress),
    ).resolves.toBeUndefined();
  });

  it("rate limits password reset attempts after the allowed IP threshold", async () => {
    const identifier = "operacoes@docfleet.local";

    for (let attempt = 0; attempt < 9; attempt += 1) {
      await consumePasswordResetAttempt(`${attempt}-${identifier}`, testIpAddress);
    }

    await expect(
      consumePasswordResetAttempt(`bloqueado-${identifier}`, testIpAddress),
    ).rejects.toMatchObject<
      Partial<AuthRateLimitError>
    >({
      name: "AuthRateLimitError",
    });
  });
});

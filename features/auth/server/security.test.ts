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
  beforeEach(async () => {
    await resetSqliteStorageState();
    await resetSqliteDatabase();
  });

  afterAll(async () => {
    await resetSqliteStorageState();
  });

  it("blocks login after reaching the configured failed-attempt limit", async () => {
    const identifier = "OPERACOES@DOCFLEET.LOCAL";

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await registerFailedLoginAttempt(identifier);
    }

    await expect(assertLoginAllowed(" operacoes@docfleet.local ")).rejects.toMatchObject<
      Partial<AuthRateLimitError>
    >({
      name: "AuthRateLimitError",
    });
  });

  it("clears login attempts using the normalized identifier", async () => {
    await registerFailedLoginAttempt("OPERACOES@DOCFLEET.LOCAL");
    await clearLoginAttempts(" operacoes@docfleet.local ");

    await expect(assertLoginAllowed("operacoes@docfleet.local")).resolves.toBeUndefined();
  });

  it("rate limits password reset attempts after the allowed threshold", async () => {
    const identifier = "operacoes@docfleet.local";

    await consumePasswordResetAttempt(identifier);
    await consumePasswordResetAttempt(identifier);
    await expect(consumePasswordResetAttempt(identifier)).rejects.toMatchObject<
      Partial<AuthRateLimitError>
    >({
      name: "AuthRateLimitError",
    });
  });
});

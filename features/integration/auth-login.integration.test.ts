import {
  AuthRateLimitError,
  validateUserCredentials,
} from "@/features/auth/server/auth-service";
import {
  resetSqliteDatabase,
  resetSqliteStorageState,
} from "@/lib/storage/sqlite-storage";

describe("login integration", () => {
  const ipAddress = "203.0.113.10";

  beforeEach(async () => {
    await resetSqliteStorageState();
    await resetSqliteDatabase();
  });

  afterAll(async () => {
    await resetSqliteStorageState();
  });

  it("authenticates with seeded credentials using the real data layer", async () => {
    const user = await validateUserCredentials({
      email: "operacoes@docfleet.local",
      password: process.env.SEED_USER_PASSWORD ?? "admin123",
      ipAddress,
    });

    expect(user).not.toBeNull();
    expect(user?.id).toBe("usr_operacoes");
    expect(user?.email).toBe("operacoes@docfleet.local");
  });

  it("blocks the login flow after repeated invalid attempts from the same identifier and IP", async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const result = await validateUserCredentials({
        email: "operacoes@docfleet.local",
        password: `senha-invalida-${attempt}`,
        ipAddress,
      });

      expect(result).toBeNull();
    }

    await expect(
      validateUserCredentials({
        email: "operacoes@docfleet.local",
        password: process.env.SEED_USER_PASSWORD ?? "admin123",
        ipAddress,
      }),
    ).rejects.toBeInstanceOf(AuthRateLimitError);
  });
});

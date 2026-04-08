import { validateUserCredentials } from "@/features/auth/server/auth-service";
import {
  resetSqliteDatabase,
  resetSqliteStorageState,
} from "@/lib/storage/sqlite-storage";

describe("validateUserCredentials", () => {
  const testIpAddress = "203.0.113.10";

  beforeEach(async () => {
    await resetSqliteStorageState();
    await resetSqliteDatabase();
  });

  afterAll(async () => {
    await resetSqliteStorageState();
  });

  it("returns the user when credentials are valid", async () => {
    const user = await validateUserCredentials({
      email: "operacoes@docfleet.local",
      password: process.env.SEED_USER_PASSWORD ?? "admin123",
      ipAddress: testIpAddress,
    });

    expect(user).not.toBeNull();
    expect(user?.email).toBe("operacoes@docfleet.local");
  });

  it("returns null when password is invalid", async () => {
    const user = await validateUserCredentials({
      email: "operacoes@docfleet.local",
      password: "senha-invalida",
      ipAddress: testIpAddress,
    });

    expect(user).toBeNull();
  });

  it("returns null when email is not found", async () => {
    const user = await validateUserCredentials({
      email: "inexistente@docfleet.local",
      password: "admin123",
      ipAddress: testIpAddress,
    });

    expect(user).toBeNull();
  });
});

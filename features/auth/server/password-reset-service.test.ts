import bcrypt from "bcryptjs";
import { resetPasswordWithToken } from "@/features/auth/server/password-reset-service";
import { SqlitePasswordResetTokenRepository } from "@/features/data/repositories/password-reset-token-repository";
import { SqliteUserRepository } from "@/features/data/repositories/user-repository";
import {
  resetSqliteDatabase,
  resetSqliteStorageState,
} from "@/lib/storage/sqlite-storage";

describe("password reset service", () => {
  const userRepository = new SqliteUserRepository();
  const passwordResetTokenRepository = new SqlitePasswordResetTokenRepository();

  beforeEach(async () => {
    await resetSqliteStorageState();
    await resetSqliteDatabase();
  });

  afterAll(async () => {
    await resetSqliteStorageState();
  });

  it("updates the password and invalidates remaining active tokens in one flow", async () => {
    const user = await userRepository.findByEmail("operacoes@docfleet.local");

    expect(user).not.toBeNull();

    const first = await passwordResetTokenRepository.createForUser(user!);
    const second = await passwordResetTokenRepository.createForUser(user!);
    const result = await resetPasswordWithToken(first.token, "NovaSenha123");

    expect(result.success).toBe(true);

    const updatedUser = await userRepository.findByEmail("operacoes@docfleet.local");

    expect(updatedUser).not.toBeNull();
    await expect(bcrypt.compare("NovaSenha123", updatedUser!.passwordHash)).resolves.toBe(
      true,
    );
    await expect(
      passwordResetTokenRepository.findValidByRawToken(first.token),
    ).resolves.toBeNull();
    await expect(
      passwordResetTokenRepository.findValidByRawToken(second.token),
    ).resolves.toBeNull();
  });

  it("returns a safe failure when the token is invalid", async () => {
    await expect(resetPasswordWithToken("invalid-token", "NovaSenha123")).resolves.toEqual({
      success: false,
    });
  });
});

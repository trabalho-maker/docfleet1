import { createHash, randomBytes, randomUUID } from "node:crypto";
import {
  withSqliteDatabase,
  withSqliteWriteLock,
} from "@/lib/storage/sqlite-storage";
import type {
  PasswordResetTokenRecord,
  PasswordResetTokenWithUser,
  StoredUser,
} from "@/features/data/types";
import { logger, maskEmail } from "@/lib/logger";

const TOKEN_TTL_MINUTES = 30;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function mapStoredUser(row: unknown[]): StoredUser {
  return {
    id: String(row[6]),
    name: String(row[7]),
    email: String(row[8]),
    role: String(row[9]),
    passwordHash: String(row[10]),
  };
}

function mapTokenRecord(row: unknown[]): PasswordResetTokenRecord {
  return {
    id: String(row[0]),
    userId: String(row[1]),
    tokenHash: String(row[2]),
    expiresAt: String(row[3]),
    createdAt: String(row[4]),
    consumedAt: row[5] ? String(row[5]) : null,
  };
}

export interface PasswordResetTokenRepository {
  createForUser(user: StoredUser): Promise<{ id: string; token: string; expiresAt: string }>;
  findValidByRawToken(token: string): Promise<PasswordResetTokenWithUser | null>;
  consume(id: string): Promise<void>;
  deleteById(id: string): Promise<void>;
  deleteExpired(): Promise<void>;
  deleteActiveForUser(userId: string): Promise<void>;
}

export class SqlitePasswordResetTokenRepository
  implements PasswordResetTokenRepository
{
  async createForUser(
    user: StoredUser,
  ): Promise<{ id: string; token: string; expiresAt: string }> {
    return withSqliteWriteLock(async (db) => {
      const rawToken = randomBytes(32).toString("hex");
      const tokenHash = hashToken(rawToken);
      const tokenId = randomUUID();
      const now = new Date();
      const expiresAt = new Date(
        now.getTime() + TOKEN_TTL_MINUTES * 60 * 1000,
      ).toISOString();

      db.run(
        `INSERT INTO password_reset_tokens
          (id, user_id, token_hash, expires_at, created_at, consumed_at)
         VALUES (?, ?, ?, ?, ?, NULL)`,
        [tokenId, user.id, tokenHash, expiresAt, now.toISOString()],
      );

      logger.info("data.password_reset_tokens.create.success", {
        userId: user.id,
        email: maskEmail(user.email),
        expiresAt,
      });

      return {
        id: tokenId,
        token: rawToken,
        expiresAt,
      };
    });
  }

  async findValidByRawToken(token: string): Promise<PasswordResetTokenWithUser | null> {
    const tokenHash = hashToken(token);
    const now = new Date().toISOString();

    return withSqliteDatabase(async (db) => {
      const result = db.exec(
        `SELECT
           prt.id,
           prt.user_id,
           prt.token_hash,
           prt.expires_at,
           prt.created_at,
           prt.consumed_at,
           u.id,
           u.name,
           u.email,
           u.role,
           u.password_hash
         FROM password_reset_tokens prt
         INNER JOIN users u ON u.id = prt.user_id
         WHERE prt.token_hash = ?
           AND prt.consumed_at IS NULL
           AND prt.expires_at > ?
         LIMIT 1`,
        [tokenHash, now],
      );

      const row = result[0]?.values?.[0];

      if (!row) {
        return null;
      }

      return {
        ...mapTokenRecord(row),
        user: mapStoredUser(row),
      };
    });
  }

  async consume(id: string): Promise<void> {
    return withSqliteWriteLock(async (db) => {
      db.run(
        "UPDATE password_reset_tokens SET consumed_at = ? WHERE id = ?",
        [new Date().toISOString(), id],
      );
    });
  }

  async deleteById(id: string): Promise<void> {
    return withSqliteWriteLock(async (db) => {
      db.run("DELETE FROM password_reset_tokens WHERE id = ?", [id]);
    });
  }

  async deleteExpired(): Promise<void> {
    return withSqliteWriteLock(async (db) => {
      db.run("DELETE FROM password_reset_tokens WHERE expires_at <= ?", [
        new Date().toISOString(),
      ]);
    });
  }

  async deleteActiveForUser(userId: string): Promise<void> {
    return withSqliteWriteLock(async (db) => {
      db.run(
        "DELETE FROM password_reset_tokens WHERE user_id = ? AND consumed_at IS NULL",
        [userId],
      );
    });
  }
}

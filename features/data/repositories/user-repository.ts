import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import type { QueryExecResult } from "sql.js";
import {
  withSqliteDatabase,
  withSqliteWriteLock,
} from "@/lib/storage/sqlite-storage";
import type { NewUserInput, StoredUser } from "@/features/data/types";
import { logger, maskEmail } from "@/lib/logger";

function readSingleNumber(result: QueryExecResult[] | undefined) {
  return Number(result?.[0]?.values?.[0]?.[0] ?? 0);
}

export interface UserRepository {
  listAll(): Promise<StoredUser[]>;
  findByEmail(email: string): Promise<StoredUser | null>;
  create(input: NewUserInput): Promise<StoredUser>;
  updatePassword(userId: string, password: string): Promise<void>;
}

export class SqliteUserRepository implements UserRepository {
  async listAll(): Promise<StoredUser[]> {
    return withSqliteDatabase(async (db) => {
      const result = db.exec(`
        SELECT id, name, email, role, password_hash
        FROM users
        ORDER BY name ASC
      `);

      const rows = result[0]?.values ?? [];

      return rows.map((row) => ({
        id: String(row[0]),
        name: String(row[1]),
        email: String(row[2]),
        role: String(row[3]),
        passwordHash: String(row[4]),
      }));
    });
  }

  async findByEmail(email: string): Promise<StoredUser | null> {
    const normalizedEmail = email.trim().toLowerCase();
    return withSqliteDatabase(async (db) => {
      const result = db.exec(
        "SELECT id, name, email, role, password_hash FROM users WHERE email = ? LIMIT 1",
        [normalizedEmail],
      );
      const row = result[0]?.values?.[0];

      if (!row) {
        return null;
      }

      return {
        id: String(row[0]),
        name: String(row[1]),
        email: String(row[2]),
        role: String(row[3]),
        passwordHash: String(row[4]),
      };
    });
  }

  async create(input: NewUserInput): Promise<StoredUser> {
    return withSqliteWriteLock(async (db) => {
      const normalizedEmail = input.email.trim().toLowerCase();
      const existingUserCount = readSingleNumber(
        db.exec("SELECT COUNT(*) FROM users WHERE email = ?", [normalizedEmail]),
      );

      if (existingUserCount > 0) {
        logger.warn("data.users.create.duplicate_email", {
          email: maskEmail(normalizedEmail),
        });
        throw new Error("USER_ALREADY_EXISTS");
      }

      const user: StoredUser = {
        id: randomUUID(),
        name: input.name.trim(),
        email: normalizedEmail,
        role: "Operador",
        passwordHash: await bcrypt.hash(input.password, 10),
      };

      db.run(
        "INSERT INTO users (id, name, email, role, password_hash) VALUES (?, ?, ?, ?, ?)",
        [user.id, user.name, user.email, user.role, user.passwordHash],
      );

      logger.info("data.users.create.success", {
        userId: user.id,
        email: maskEmail(user.email),
        role: user.role,
      });

      return user;
    });
  }

  async updatePassword(userId: string, password: string): Promise<void> {
    return withSqliteWriteLock(async (db) => {
      const passwordHash = await bcrypt.hash(password, 10);

      db.run("UPDATE users SET password_hash = ? WHERE id = ?", [
        passwordHash,
        userId,
      ]);

      logger.warn("data.users.update_password.success", {
        userId,
      });
    });
  }
}

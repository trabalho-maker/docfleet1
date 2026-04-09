import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import type { DatabaseAdapter, DatabaseRow } from "@/lib/database/adapter";
import { getDatabaseAdapter } from "@/lib/database/provider";
import type { NewUserInput, StoredUser } from "@/features/data/types";
import { logger, maskEmail } from "@/lib/logger";

function readSingleNumber(value: unknown) {
  return Number(value ?? 0);
}

export interface UserRepository {
  listAll(): Promise<StoredUser[]>;
  findByEmail(email: string): Promise<StoredUser | null>;
  create(input: NewUserInput): Promise<StoredUser>;
  updatePassword(userId: string, password: string): Promise<void>;
}

function mapStoredUser(row: DatabaseRow): StoredUser {
  return {
    id: String(row[0]),
    name: String(row[1]),
    email: String(row[2]),
    role: String(row[3]),
    passwordHash: String(row[4]),
  };
}

export class SqliteUserRepository implements UserRepository {
  constructor(private readonly database: DatabaseAdapter = getDatabaseAdapter()) {}

  async listAll(): Promise<StoredUser[]> {
    const rows = await this.database.query(`
        SELECT id, name, email, role, password_hash
        FROM users
        ORDER BY name ASC
      `);

    return rows.map(mapStoredUser);
  }

  async findByEmail(email: string): Promise<StoredUser | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const row = await this.database.queryOne(
      "SELECT id, name, email, role, password_hash FROM users WHERE email = ? LIMIT 1",
      [normalizedEmail],
    );

    return row ? mapStoredUser(row) : null;
  }

  async create(input: NewUserInput): Promise<StoredUser> {
    return this.database.write(async (session) => {
      const normalizedEmail = input.email.trim().toLowerCase();
      const existingUserCount = readSingleNumber(
        await session.queryValue("SELECT COUNT(*) FROM users WHERE email = ?", [
          normalizedEmail,
        ]),
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

      await session.execute(
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
    return this.database.write(async (session) => {
      const passwordHash = await bcrypt.hash(password, 10);

      await session.execute("UPDATE users SET password_hash = ? WHERE id = ?", [
        passwordHash,
        userId,
      ]);

      logger.warn("data.users.update_password.success", {
        userId,
      });
    });
  }
}

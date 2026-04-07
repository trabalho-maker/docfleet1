import { getSqliteDatabase, withSqliteWriteLock } from "@/lib/storage/sqlite-storage";
import type { RateLimitRecord, RateLimitScope } from "@/features/data/types";

export type RateLimitPolicy = {
  windowMs: number;
  maxAttempts: number;
  blockDurationMs: number;
};

export type RateLimitState = {
  allowed: boolean;
  retryAfterSeconds: number;
  attemptsRemaining: number;
};

function mapRecord(row: unknown[]): RateLimitRecord {
  return {
    scope: row[0] as RateLimitScope,
    identifier: String(row[1]),
    attempts: Number(row[2]),
    windowStartedAt: String(row[3]),
    blockedUntil: row[4] ? String(row[4]) : null,
    updatedAt: String(row[5]),
  };
}

function toIsoDate(timestamp: number) {
  return new Date(timestamp).toISOString();
}

function getRetryAfterSeconds(timestamp: number) {
  return Math.max(1, Math.ceil((timestamp - Date.now()) / 1000));
}

export interface AuthRateLimitRepository {
  getState(
    scope: RateLimitScope,
    identifier: string,
    policy: RateLimitPolicy,
  ): Promise<RateLimitState>;
  registerFailure(
    scope: RateLimitScope,
    identifier: string,
    policy: RateLimitPolicy,
  ): Promise<RateLimitState>;
  registerAttempt(
    scope: RateLimitScope,
    identifier: string,
    policy: RateLimitPolicy,
  ): Promise<RateLimitState>;
  clear(scope: RateLimitScope, identifier: string): Promise<void>;
}

export class SqliteAuthRateLimitRepository implements AuthRateLimitRepository {
  private async findRecord(
    scope: RateLimitScope,
    identifier: string,
  ): Promise<RateLimitRecord | null> {
    const db = await getSqliteDatabase();
    const result = db.exec(
      `SELECT scope, identifier, attempts, window_started_at, blocked_until, updated_at
       FROM auth_rate_limits
       WHERE scope = ? AND identifier = ?
       LIMIT 1`,
      [scope, identifier],
    );
    const row = result[0]?.values?.[0];

    return row ? mapRecord(row) : null;
  }

  async getState(
    scope: RateLimitScope,
    identifier: string,
    policy: RateLimitPolicy,
  ): Promise<RateLimitState> {
    const record = await this.findRecord(scope, identifier);
    const now = Date.now();

    if (!record) {
      return {
        allowed: true,
        retryAfterSeconds: 0,
        attemptsRemaining: policy.maxAttempts,
      };
    }

    const blockedUntilMs = record.blockedUntil ? Date.parse(record.blockedUntil) : 0;

    if (blockedUntilMs > now) {
      return {
        allowed: false,
        retryAfterSeconds: getRetryAfterSeconds(blockedUntilMs),
        attemptsRemaining: 0,
      };
    }

    const windowStartedMs = Date.parse(record.windowStartedAt);

    if (windowStartedMs + policy.windowMs <= now) {
      return {
        allowed: true,
        retryAfterSeconds: 0,
        attemptsRemaining: policy.maxAttempts,
      };
    }

    return {
      allowed: true,
      retryAfterSeconds: 0,
      attemptsRemaining: Math.max(0, policy.maxAttempts - record.attempts),
    };
  }

  async registerFailure(
    scope: RateLimitScope,
    identifier: string,
    policy: RateLimitPolicy,
  ): Promise<RateLimitState> {
    return withSqliteWriteLock(async (db) => {
      const now = Date.now();
      const nowIso = toIsoDate(now);
      const result = db.exec(
        `SELECT scope, identifier, attempts, window_started_at, blocked_until, updated_at
         FROM auth_rate_limits
         WHERE scope = ? AND identifier = ?
         LIMIT 1`,
        [scope, identifier],
      );
      const existing = result[0]?.values?.[0] ? mapRecord(result[0].values[0]) : null;

      let attempts = 1;
      let windowStartedAt = nowIso;
      let blockedUntil: string | null = null;

      if (existing) {
        const blockedUntilMs = existing.blockedUntil
          ? Date.parse(existing.blockedUntil)
          : 0;
        const windowStartedMs = Date.parse(existing.windowStartedAt);

        if (blockedUntilMs > now) {
          return {
            allowed: false,
            retryAfterSeconds: getRetryAfterSeconds(blockedUntilMs),
            attemptsRemaining: 0,
          };
        }

        if (windowStartedMs + policy.windowMs > now) {
          attempts = existing.attempts + 1;
          windowStartedAt = existing.windowStartedAt;
        }
      }

      if (attempts >= policy.maxAttempts) {
        blockedUntil = toIsoDate(now + policy.blockDurationMs);
      }

      db.run(
        `INSERT OR REPLACE INTO auth_rate_limits
          (scope, identifier, attempts, window_started_at, blocked_until, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [scope, identifier, attempts, windowStartedAt, blockedUntil, nowIso],
      );

      if (blockedUntil) {
        return {
          allowed: false,
          retryAfterSeconds: getRetryAfterSeconds(Date.parse(blockedUntil)),
          attemptsRemaining: 0,
        };
      }

      return {
        allowed: true,
        retryAfterSeconds: 0,
        attemptsRemaining: Math.max(0, policy.maxAttempts - attempts),
      };
    });
  }

  async registerAttempt(
    scope: RateLimitScope,
    identifier: string,
    policy: RateLimitPolicy,
  ): Promise<RateLimitState> {
    return this.registerFailure(scope, identifier, policy);
  }

  async clear(scope: RateLimitScope, identifier: string): Promise<void> {
    return withSqliteWriteLock(async (db) => {
      db.run("DELETE FROM auth_rate_limits WHERE scope = ? AND identifier = ?", [
        scope,
        identifier,
      ]);
    });
  }
}

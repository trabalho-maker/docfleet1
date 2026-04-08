import { withSqliteDatabase } from "@/lib/storage/sqlite-storage";
import type { OperationalAlert } from "@/features/data/types";

export interface AlertRepository {
  listOpen(limit?: number): Promise<OperationalAlert[]>;
  countOpen(): Promise<number>;
}

export class SqliteAlertRepository implements AlertRepository {
  async listOpen(limit = 6): Promise<OperationalAlert[]> {
    return withSqliteDatabase(async (db) => {
      const result = db.exec(
        `
        SELECT id, title, severity, team, created_at
        FROM alerts
        ORDER BY created_at DESC
        LIMIT ?
      `,
        [limit],
      );
      const rows = result[0]?.values ?? [];

      return rows.map((row) => ({
        id: String(row[0]),
        title: String(row[1]),
        severity: row[2] as OperationalAlert["severity"],
        team: String(row[3]),
        createdAt: String(row[4]),
      }));
    });
  }

  async countOpen(): Promise<number> {
    return withSqliteDatabase(async (db) => {
      const result = db.exec("SELECT COUNT(*) FROM alerts");
      return Number(result[0]?.values?.[0]?.[0] ?? 0);
    });
  }
}

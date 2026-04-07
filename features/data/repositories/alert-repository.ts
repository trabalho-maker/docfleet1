import { getSqliteDatabase } from "@/lib/storage/sqlite-storage";
import type { OperationalAlert } from "@/features/data/types";

export interface AlertRepository {
  listOpen(): Promise<OperationalAlert[]>;
}

export class LocalAlertRepository implements AlertRepository {
  async listOpen(): Promise<OperationalAlert[]> {
    const db = await getSqliteDatabase();
    const result = db.exec(`
      SELECT id, title, severity, team, created_at
      FROM alerts
      ORDER BY created_at DESC
    `);
    const rows = result[0]?.values ?? [];

    return rows.slice(0, 6).map((row) => ({
      id: String(row[0]),
      title: String(row[1]),
      severity: row[2] as OperationalAlert["severity"],
      team: String(row[3]),
      createdAt: String(row[4]),
    }));
  }
}

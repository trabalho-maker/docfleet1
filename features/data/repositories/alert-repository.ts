import { randomUUID } from "node:crypto";
import {
  withSqliteDatabase,
  withSqliteWriteLock,
} from "@/lib/storage/sqlite-storage";
import type {
  GeneratedOperationalAlertInput,
  OperationalAlert,
} from "@/features/data/types";

export interface AlertRepository {
  listOpen(limit?: number): Promise<OperationalAlert[]>;
  countOpen(): Promise<number>;
  replaceGenerated(alerts: GeneratedOperationalAlertInput[]): Promise<void>;
}

export class SqliteAlertRepository implements AlertRepository {
  async listOpen(limit = 6): Promise<OperationalAlert[]> {
    return withSqliteDatabase(async (db) => {
      const result = db.exec(
        `
        SELECT id, title, severity, team, created_at, kind, source_document_id
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
        kind: row[5] ? (String(row[5]) as OperationalAlert["kind"]) : "manual",
        sourceDocumentId: row[6] ? String(row[6]) : null,
      }));
    });
  }

  async countOpen(): Promise<number> {
    return withSqliteDatabase(async (db) => {
      const result = db.exec("SELECT COUNT(*) FROM alerts");
      return Number(result[0]?.values?.[0]?.[0] ?? 0);
    });
  }

  async replaceGenerated(alerts: GeneratedOperationalAlertInput[]): Promise<void> {
    return withSqliteWriteLock(async (db) => {
      db.run("DELETE FROM alerts WHERE kind = ?", ["document_expiration"]);

      for (const alert of alerts) {
        db.run(
          `
            INSERT INTO alerts
              (id, title, severity, team, created_at, kind, source_document_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `,
          [
            randomUUID(),
            alert.title,
            alert.severity,
            alert.team,
            alert.createdAt,
            alert.kind,
            alert.sourceDocumentId,
          ],
        );
      }
    });
  }
}

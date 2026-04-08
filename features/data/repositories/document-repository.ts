import { withSqliteDatabase } from "@/lib/storage/sqlite-storage";
import type { FleetDocument } from "@/features/data/types";

export interface DocumentRepository {
  listRecent(limit?: number): Promise<FleetDocument[]>;
  countAll(): Promise<number>;
  countPending(): Promise<number>;
}

export class SqliteDocumentRepository implements DocumentRepository {
  async listRecent(limit = 6): Promise<FleetDocument[]> {
    return withSqliteDatabase(async (db) => {
      const result = db.exec(
        `
        SELECT id, title, owner, category, status, due_date
        FROM documents
        ORDER BY due_date ASC
        LIMIT ?
      `,
        [limit],
      );
      const rows = result[0]?.values ?? [];

      return rows.map((row) => ({
        id: String(row[0]),
        title: String(row[1]),
        owner: String(row[2]),
        category: String(row[3]),
        status: row[4] as FleetDocument["status"],
        dueDate: String(row[5]),
      }));
    });
  }

  async countAll(): Promise<number> {
    return withSqliteDatabase(async (db) => {
      const result = db.exec("SELECT COUNT(*) FROM documents");
      return Number(result[0]?.values?.[0]?.[0] ?? 0);
    });
  }

  async countPending(): Promise<number> {
    return withSqliteDatabase(async (db) => {
      const result = db.exec(
        "SELECT COUNT(*) FROM documents WHERE status <> ?",
        ["Em dia"],
      );
      return Number(result[0]?.values?.[0]?.[0] ?? 0);
    });
  }
}

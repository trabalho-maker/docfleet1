import { withSqliteDatabase } from "@/lib/storage/sqlite-storage";
import type { FleetDocument } from "@/features/data/types";

export interface DocumentRepository {
  listRecent(): Promise<FleetDocument[]>;
}

export class LocalDocumentRepository implements DocumentRepository {
  async listRecent(): Promise<FleetDocument[]> {
    return withSqliteDatabase(async (db) => {
      const result = db.exec(`
        SELECT id, title, owner, category, status, due_date
        FROM documents
        ORDER BY due_date ASC
      `);
      const rows = result[0]?.values ?? [];

      return rows.slice(0, 6).map((row) => ({
        id: String(row[0]),
        title: String(row[1]),
        owner: String(row[2]),
        category: String(row[3]),
        status: row[4] as FleetDocument["status"],
        dueDate: String(row[5]),
      }));
    });
  }
}

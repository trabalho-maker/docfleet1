import { randomUUID } from "node:crypto";
import type { DatabaseAdapter, DatabaseRow } from "@/lib/database/adapter";
import { getDatabaseAdapter } from "@/lib/database/provider";
import type {
  GeneratedOperationalAlertInput,
  OperationalAlert,
} from "@/features/data/types";

export interface AlertRepository {
  listOpen(limit?: number): Promise<OperationalAlert[]>;
  countOpen(): Promise<number>;
  listGenerated(): Promise<OperationalAlert[]>;
  findGeneratedBySourceDocumentId(documentId: string): Promise<OperationalAlert | null>;
  upsertGeneratedForDocument(alert: GeneratedOperationalAlertInput): Promise<void>;
  deleteGeneratedBySourceDocumentId(documentId: string): Promise<void>;
}

function mapAlert(row: DatabaseRow): OperationalAlert {
  return {
    id: String(row[0]),
    title: String(row[1]),
    severity: row[2] as OperationalAlert["severity"],
    team: String(row[3]),
    createdAt: String(row[4]),
    kind: row[5] ? (String(row[5]) as OperationalAlert["kind"]) : "manual",
    sourceDocumentId: row[6] ? String(row[6]) : null,
  };
}

export class SqliteAlertRepository implements AlertRepository {
  constructor(private readonly database: DatabaseAdapter = getDatabaseAdapter()) {}

  async listOpen(limit = 6): Promise<OperationalAlert[]> {
    const rows = await this.database.query(
      `
        SELECT id, title, severity, team, created_at, kind, source_document_id
        FROM alerts
        ORDER BY created_at DESC
        LIMIT ?
      `,
      [limit],
    );

    return rows.map(mapAlert);
  }

  async countOpen(): Promise<number> {
    return Number(await this.database.queryValue("SELECT COUNT(*) FROM alerts"));
  }

  async listGenerated(): Promise<OperationalAlert[]> {
    const rows = await this.database.query(
      `
        SELECT id, title, severity, team, created_at, kind, source_document_id
        FROM alerts
        WHERE kind = ?
        ORDER BY created_at DESC
      `,
      ["document_expiration"],
    );

    return rows.map(mapAlert);
  }

  async findGeneratedBySourceDocumentId(
    documentId: string,
  ): Promise<OperationalAlert | null> {
    const row = await this.database.queryOne(
      `
        SELECT id, title, severity, team, created_at, kind, source_document_id
        FROM alerts
        WHERE kind = ? AND source_document_id = ?
        LIMIT 1
      `,
      ["document_expiration", documentId],
    );

    return row ? mapAlert(row) : null;
  }

  async upsertGeneratedForDocument(alert: GeneratedOperationalAlertInput): Promise<void> {
    return this.database.write(async (session) => {
      const existingRow = await session.queryOne(
        `
        SELECT id
        FROM alerts
        WHERE kind = ? AND source_document_id = ?
        LIMIT 1
      `,
        [alert.kind, alert.sourceDocumentId],
      );
      const existingId = existingRow?.[0];

      if (existingId) {
        await session.execute(
          `
            UPDATE alerts
            SET title = ?, severity = ?, team = ?, created_at = ?, kind = ?, source_document_id = ?
            WHERE id = ?
          `,
          [
            alert.title,
            alert.severity,
            alert.team,
            alert.createdAt,
            alert.kind,
            alert.sourceDocumentId,
            existingId,
          ],
        );

        return;
      }

      await session.execute(
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
    });
  }

  async deleteGeneratedBySourceDocumentId(documentId: string): Promise<void> {
    return this.database.write(async (session) => {
      await session.execute(
        `
        DELETE FROM alerts
        WHERE kind = ? AND source_document_id = ?
      `,
        ["document_expiration", documentId],
      );
    });
  }
}

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
  listRelevant(limit?: number): Promise<OperationalAlert[]>;
  countRelevant(): Promise<number>;
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

async function queryUniqueGeneratedAlertBySourceDocumentId(
  database: Pick<DatabaseAdapter, "query">,
  documentId: string,
) {
  const rows = await database.query(
    `
      SELECT id, title, severity, team, created_at, kind, source_document_id
      FROM alerts
      WHERE kind = ? AND source_document_id = ?
    `,
    ["document_expiration", documentId],
  );

  if (rows.length > 1) {
    throw new Error("ALERT_DUPLICATE_SOURCE_DOCUMENT");
  }

  return rows[0] ? mapAlert(rows[0]) : null;
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

  async listRelevant(limit = 6): Promise<OperationalAlert[]> {
    const rows = await this.database.query(
      `
        SELECT id, title, severity, team, created_at, kind, source_document_id
        FROM alerts
        WHERE COALESCE(kind, 'manual') IN (?, ?)
        ORDER BY
          CASE WHEN kind = ? THEN 0 ELSE 1 END,
          CASE severity
            WHEN 'Alta' THEN 0
            WHEN 'Media' THEN 1
            ELSE 2
          END,
          created_at DESC
        LIMIT ?
      `,
      ["document_expiration", "operational", "document_expiration", limit],
    );

    return rows.map(mapAlert);
  }

  async countRelevant(): Promise<number> {
    return Number(
      await this.database.queryValue(
        `
          SELECT COUNT(*)
          FROM alerts
          WHERE COALESCE(kind, 'manual') IN (?, ?)
        `,
        ["document_expiration", "operational"],
      ),
    );
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
    return queryUniqueGeneratedAlertBySourceDocumentId(this.database, documentId);
  }

  async upsertGeneratedForDocument(alert: GeneratedOperationalAlertInput): Promise<void> {
    return this.database.write(async (session) => {
      await session.execute(
        `
          INSERT INTO alerts
            (id, title, severity, team, created_at, kind, source_document_id)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(source_document_id) DO UPDATE SET
            title = excluded.title,
            severity = excluded.severity,
            team = excluded.team,
            created_at = excluded.created_at,
            kind = excluded.kind
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

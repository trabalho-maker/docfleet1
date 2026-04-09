import { randomUUID } from "node:crypto";
import type { DatabaseAdapter, DatabaseRow } from "@/lib/database/adapter";
import { getDatabaseAdapter } from "@/lib/database/provider";
import type {
  CreateDocumentInput,
  FleetDocument,
  UpdateDocumentInput,
} from "@/features/data/types";
import {
  calculateDocumentStatus,
  formatUtcDateOnly,
  getDocumentAttentionThresholdDate,
} from "@/features/documents/lib/expiration";
import { logger } from "@/lib/logger";

export interface DocumentRepository {
  listAll(): Promise<FleetDocument[]>;
  listPage(page: number, pageSize: number): Promise<FleetDocument[]>;
  listRecent(limit?: number): Promise<FleetDocument[]>;
  listRequiringAttention(now?: Date): Promise<FleetDocument[]>;
  findById(documentId: string): Promise<FleetDocument | null>;
  create(input: CreateDocumentInput): Promise<FleetDocument>;
  update(documentId: string, input: UpdateDocumentInput): Promise<FleetDocument>;
  delete(documentId: string): Promise<void>;
  countAll(): Promise<number>;
  countPending(): Promise<number>;
  countAttention(now?: Date): Promise<number>;
}

function mapDocument(row: DatabaseRow): FleetDocument {
  const dueDate = String(row[5]);

  return {
    id: String(row[0]),
    name: String(row[1]),
    owner: String(row[2]),
    type: String(row[3]),
    status: calculateDocumentStatus(dueDate),
    dueDate,
  };
}

function readSingleNumber(value: unknown) {
  return Number(value ?? 0);
}

export class SqliteDocumentRepository implements DocumentRepository {
  constructor(private readonly database: DatabaseAdapter = getDatabaseAdapter()) {}

  async listAll(): Promise<FleetDocument[]> {
    const rows = await this.database.query(`
        SELECT id, name, owner, type, status, due_date
        FROM documents
        ORDER BY due_date ASC, name ASC
      `);

    return rows.map(mapDocument);
  }

  async listPage(page: number, pageSize: number): Promise<FleetDocument[]> {
    const normalizedPage = Math.max(1, Math.floor(page));
    const normalizedPageSize = Math.max(1, Math.min(100, Math.floor(pageSize)));
    const offset = (normalizedPage - 1) * normalizedPageSize;
    const rows = await this.database.query(
      `
        SELECT id, name, owner, type, status, due_date
        FROM documents
        ORDER BY due_date ASC, name ASC
        LIMIT ? OFFSET ?
      `,
      [normalizedPageSize, offset],
    );

    return rows.map(mapDocument);
  }

  async listRecent(limit = 6): Promise<FleetDocument[]> {
    const rows = await this.database.query(
      `
        SELECT id, name, owner, type, status, due_date
        FROM documents
        ORDER BY due_date ASC
        LIMIT ?
      `,
      [limit],
    );

    return rows.map(mapDocument);
  }

  async listRequiringAttention(now = new Date()): Promise<FleetDocument[]> {
    const attentionThresholdDate = getDocumentAttentionThresholdDate(now);
    const rows = await this.database.query(
      `
        SELECT id, name, owner, type, status, due_date
        FROM documents
        WHERE due_date <= ?
        ORDER BY due_date ASC, name ASC
      `,
      [attentionThresholdDate],
    );

    return rows.map(mapDocument);
  }

  async findById(documentId: string): Promise<FleetDocument | null> {
    const row = await this.database.queryOne(
      `
          SELECT id, name, owner, type, status, due_date
          FROM documents
          WHERE id = ?
          LIMIT 1
        `,
      [documentId],
    );

    return row ? mapDocument(row) : null;
  }

  async create(input: CreateDocumentInput): Promise<FleetDocument> {
    return this.database.write(async (session) => {
      const document: FleetDocument = {
        id: randomUUID(),
        name: input.name.trim(),
        type: input.type.trim(),
        dueDate: input.dueDate,
        status: calculateDocumentStatus(input.dueDate),
        owner: input.owner.trim(),
      };

      await session.execute(
        `
          INSERT INTO documents (id, name, owner, type, status, due_date)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          document.id,
          document.name,
          document.owner,
          document.type,
          document.status,
          document.dueDate,
        ],
      );

      logger.info("data.documents.create.success", {
        documentId: document.id,
        status: document.status,
      });

      return document;
    });
  }

  async update(
    documentId: string,
    input: UpdateDocumentInput,
  ): Promise<FleetDocument> {
    return this.database.write(async (session) => {
      const existingRow = await session.queryOne(
        `
          SELECT id, name, owner, type, status, due_date
          FROM documents
          WHERE id = ?
          LIMIT 1
        `,
        [documentId],
      );

      if (!existingRow) {
        throw new Error("DOCUMENT_NOT_FOUND");
      }

      await session.execute(
        `
          UPDATE documents
          SET name = ?, type = ?, due_date = ?, status = ?
          WHERE id = ?
        `,
        [
          input.name.trim(),
          input.type.trim(),
          input.dueDate,
          calculateDocumentStatus(input.dueDate),
          documentId,
        ],
      );

      const updated: FleetDocument = {
        id: String(existingRow[0]),
        name: input.name.trim(),
        owner: String(existingRow[2]),
        type: input.type.trim(),
        status: calculateDocumentStatus(input.dueDate),
        dueDate: input.dueDate,
      };

      logger.info("data.documents.update.success", {
        documentId,
        status: updated.status,
      });

      return updated;
    });
  }

  async delete(documentId: string): Promise<void> {
    return this.database.write(async (session) => {
      const deletedCount = readSingleNumber(
        await session.queryValue("SELECT COUNT(*) FROM documents WHERE id = ?", [
          documentId,
        ]),
      );

      if (deletedCount === 0) {
        throw new Error("DOCUMENT_NOT_FOUND");
      }

      await session.execute("DELETE FROM documents WHERE id = ?", [documentId]);

      logger.warn("data.documents.delete.success", {
        documentId,
      });
    });
  }

  async countAll(): Promise<number> {
    return readSingleNumber(await this.database.queryValue("SELECT COUNT(*) FROM documents"));
  }

  async countPending(): Promise<number> {
    const attentionThresholdDate = getDocumentAttentionThresholdDate();
    return readSingleNumber(
      await this.database.queryValue("SELECT COUNT(*) FROM documents WHERE due_date <= ?", [
        attentionThresholdDate,
      ]),
    );
  }

  async countAttention(now = new Date()): Promise<number> {
    const today = formatUtcDateOnly(now);
    const attentionThresholdDate = getDocumentAttentionThresholdDate(now);

    return readSingleNumber(
      await this.database.queryValue(
        "SELECT COUNT(*) FROM documents WHERE due_date >= ? AND due_date <= ?",
        [today, attentionThresholdDate],
      ),
    );
  }
}

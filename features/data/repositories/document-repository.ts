import type { QueryExecResult } from "sql.js";
import { randomUUID } from "node:crypto";
import {
  withSqliteDatabase,
  withSqliteWriteLock,
} from "@/lib/storage/sqlite-storage";
import type {
  CreateDocumentInput,
  FleetDocument,
  UpdateDocumentInput,
} from "@/features/data/types";
import { logger } from "@/lib/logger";

export interface DocumentRepository {
  listAll(): Promise<FleetDocument[]>;
  listRecent(limit?: number): Promise<FleetDocument[]>;
  findById(documentId: string): Promise<FleetDocument | null>;
  create(input: CreateDocumentInput): Promise<FleetDocument>;
  update(documentId: string, input: UpdateDocumentInput): Promise<FleetDocument>;
  delete(documentId: string): Promise<void>;
  countAll(): Promise<number>;
  countPending(): Promise<number>;
}

function mapDocument(row: unknown[]): FleetDocument {
  return {
    id: String(row[0]),
    title: String(row[1]),
    owner: String(row[2]),
    category: String(row[3]),
    status: row[4] as FleetDocument["status"],
    dueDate: String(row[5]),
  };
}

function readSingleNumber(result: QueryExecResult[] | undefined) {
  return Number(result?.[0]?.values?.[0]?.[0] ?? 0);
}

export class SqliteDocumentRepository implements DocumentRepository {
  async listAll(): Promise<FleetDocument[]> {
    return withSqliteDatabase(async (db) => {
      const result = db.exec(`
        SELECT id, title, owner, category, status, due_date
        FROM documents
        ORDER BY due_date ASC, title ASC
      `);
      const rows = result[0]?.values ?? [];

      return rows.map(mapDocument);
    });
  }

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

      return rows.map(mapDocument);
    });
  }

  async findById(documentId: string): Promise<FleetDocument | null> {
    return withSqliteDatabase(async (db) => {
      const result = db.exec(
        `
          SELECT id, title, owner, category, status, due_date
          FROM documents
          WHERE id = ?
          LIMIT 1
        `,
        [documentId],
      );
      const row = result[0]?.values?.[0];

      return row ? mapDocument(row) : null;
    });
  }

  async create(input: CreateDocumentInput): Promise<FleetDocument> {
    return withSqliteWriteLock(async (db) => {
      const document: FleetDocument = {
        id: randomUUID(),
        title: input.name.trim(),
        category: input.type.trim(),
        dueDate: input.dueDate,
        status: input.status,
        owner: input.owner.trim(),
      };

      db.run(
        `
          INSERT INTO documents (id, title, owner, category, status, due_date)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          document.id,
          document.title,
          document.owner,
          document.category,
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
    return withSqliteWriteLock(async (db) => {
      const existingResult = db.exec(
        `
          SELECT id, title, owner, category, status, due_date
          FROM documents
          WHERE id = ?
          LIMIT 1
        `,
        [documentId],
      );
      const existingRow = existingResult[0]?.values?.[0];

      if (!existingRow) {
        throw new Error("DOCUMENT_NOT_FOUND");
      }

      db.run(
        `
          UPDATE documents
          SET title = ?, category = ?, due_date = ?, status = ?
          WHERE id = ?
        `,
        [
          input.name.trim(),
          input.type.trim(),
          input.dueDate,
          input.status,
          documentId,
        ],
      );

      const updated: FleetDocument = {
        id: String(existingRow[0]),
        title: input.name.trim(),
        owner: String(existingRow[2]),
        category: input.type.trim(),
        status: input.status,
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
    return withSqliteWriteLock(async (db) => {
      const deletedCount = readSingleNumber(
        db.exec("SELECT COUNT(*) FROM documents WHERE id = ?", [documentId]),
      );

      if (deletedCount === 0) {
        throw new Error("DOCUMENT_NOT_FOUND");
      }

      db.run("DELETE FROM documents WHERE id = ?", [documentId]);

      logger.warn("data.documents.delete.success", {
        documentId,
      });
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

import { randomUUID } from "node:crypto";
import type {
  DatabaseAdapter,
  DatabaseReadSession,
  DatabaseRow,
} from "@/lib/database/adapter";
import { getDatabaseAdapter } from "@/lib/database/provider";
import type {
  CreateDocumentInput,
  FleetDocument,
  UpdateDocumentInput,
} from "@/features/data/types";
import type {
  DocumentCategoryFilter,
  DocumentType,
} from "@/features/documents/constants";
import {
  getDocumentTypeLabel,
  normalizeDocumentType,
} from "@/features/documents/constants";
import {
  addUtcDays,
  calculateDocumentStatus,
  formatUtcDateOnly,
  getDocumentAttentionThresholdDate,
} from "@/features/documents/lib/expiration";
import type { DocumentDueSummary } from "@/features/documents/lib/document-due-summary";
import { logger } from "@/lib/logger";

export type DocumentRepositoryFilters = {
  category?: DocumentCategoryFilter | "";
  associateId?: string;
  documentTypes?: DocumentType[];
};

export type DocumentTypeStatusSummary = {
  documentType: DocumentType;
  valid: number;
  attention: number;
  expired: number;
  total: number;
};

export type DocumentTimelineBucket = {
  bucket: string;
  total: number;
};

export interface DocumentRepository {
  listAll(filters?: DocumentRepositoryFilters): Promise<FleetDocument[]>;
  listByAssociateIds(
    associateIds: string[],
    filters?: Omit<DocumentRepositoryFilters, "associateId">,
  ): Promise<FleetDocument[]>;
  listPage(
    page: number,
    pageSize: number,
    filters?: DocumentRepositoryFilters,
  ): Promise<FleetDocument[]>;
  summarizeByDueDate(
    filters?: DocumentRepositoryFilters,
    now?: Date,
  ): Promise<DocumentDueSummary>;
  listRecent(limit?: number, filters?: DocumentRepositoryFilters): Promise<FleetDocument[]>;
  listRequiringAttention(
    now?: Date,
    filters?: DocumentRepositoryFilters,
  ): Promise<FleetDocument[]>;
  findById(documentId: string): Promise<FleetDocument | null>;
  findByAssociateId(
    associateId: string,
    filters?: Omit<DocumentRepositoryFilters, "associateId">,
  ): Promise<FleetDocument[]>;
  findByAssociateAndType(
    associateId: string,
    documentType: DocumentType,
  ): Promise<FleetDocument | null>;
  create(input: CreateDocumentInput): Promise<FleetDocument>;
  update(documentId: string, input: UpdateDocumentInput): Promise<FleetDocument>;
  delete(documentId: string): Promise<void>;
  countAll(filters?: DocumentRepositoryFilters): Promise<number>;
  countPending(now?: Date, filters?: DocumentRepositoryFilters): Promise<number>;
  countAttention(now?: Date, filters?: DocumentRepositoryFilters): Promise<number>;
  groupByType(
    now?: Date,
    limit?: number,
    filters?: DocumentRepositoryFilters,
  ): Promise<DocumentTypeStatusSummary[]>;
  summarizeExpirationTimeline(
    now?: Date,
    filters?: DocumentRepositoryFilters,
    monthsBack?: number,
    monthsForward?: number,
  ): Promise<DocumentTimelineBucket[]>;
}

function buildDocumentSelect(whereClause = "", limitClause = "") {
  return `
    SELECT
      d.id,
      d.name,
      d.owner,
      d.type,
      d.status,
      d.due_date,
      d.associate_id,
      d.notes,
      a.name,
      a.registration_number,
      ap.modalidade_associado
    FROM documents d
    LEFT JOIN associates a
      ON a.id = d.associate_id
    LEFT JOIN associate_profiles ap
      ON ap.associate_id = d.associate_id
    ${whereClause}
    ORDER BY d.due_date ASC, a.name ASC, d.name ASC
    ${limitClause}
  `;
}

function buildFiltersWhereClause(filters?: DocumentRepositoryFilters) {
  const clauses: string[] = [];
  const params: unknown[] = [];

  if (filters?.category) {
    clauses.push("UPPER(COALESCE(ap.modalidade_associado, '')) = ?");
    params.push(filters.category);
  }

  if (filters?.associateId) {
    clauses.push("d.associate_id = ?");
    params.push(filters.associateId);
  }

  if (filters?.documentTypes && filters.documentTypes.length > 0) {
    clauses.push(
      `d.type IN (${filters.documentTypes.map(() => "?").join(", ")})`,
    );
    params.push(...filters.documentTypes);
  }

  return {
    whereClause: clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "",
    params,
  };
}

function normalizeNullable(value: unknown) {
  if (value == null) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized ? normalized : null;
}

function mapDocument(row: DatabaseRow): FleetDocument {
  const dueDate = String(row[5]);
  const documentType = normalizeDocumentType(String(row[3]));

  return {
    id: String(row[0]),
    name: normalizeNullable(row[1]) ?? getDocumentTypeLabel(documentType),
    owner: String(row[2]),
    documentType,
    status: calculateDocumentStatus(dueDate),
    dueDate,
    associateId: normalizeNullable(row[6]),
    notes: normalizeNullable(row[7]),
    associateName: normalizeNullable(row[8]),
    associateRegistrationNumber: normalizeNullable(row[9]),
    associateCategory: normalizeNullable(row[10]) as FleetDocument["associateCategory"],
  };
}

function readSingleNumber(value: unknown) {
  return Number(value ?? 0);
}

function buildFilteredDocumentFromClause(filters?: DocumentRepositoryFilters) {
  const { whereClause, params } = buildFiltersWhereClause(filters);

  return {
    fromClause: `
      FROM documents d
      LEFT JOIN associate_profiles ap
        ON ap.associate_id = d.associate_id
      ${whereClause}
    `,
    params,
  };
}

async function queryUniqueAssociateDocument(
  database: DatabaseReadSession,
  associateId: string,
  documentType: DocumentType,
) {
  const rows = await database.query(
    buildDocumentSelect("WHERE d.associate_id = ? AND d.type = ?"),
    [associateId, documentType],
  );

  if (rows.length > 1) {
    throw new Error("DOCUMENT_DUPLICATE_ASSOCIATE_TYPE");
  }

  return rows[0] ? mapDocument(rows[0]) : null;
}

export class SqliteDocumentRepository implements DocumentRepository {
  constructor(private readonly database: DatabaseAdapter = getDatabaseAdapter()) {}

  async listAll(filters?: DocumentRepositoryFilters): Promise<FleetDocument[]> {
    const { whereClause, params } = buildFiltersWhereClause(filters);
    const rows = await this.database.query(buildDocumentSelect(whereClause), params);

    return rows.map(mapDocument);
  }

  async listByAssociateIds(
    associateIds: string[],
    filters?: Omit<DocumentRepositoryFilters, "associateId">,
  ): Promise<FleetDocument[]> {
    const normalizedAssociateIds = Array.from(
      new Set(
        associateIds
          .map((associateId) => associateId.trim())
          .filter(Boolean),
      ),
    );

    if (normalizedAssociateIds.length === 0) {
      return [];
    }

    const { whereClause, params } = buildFiltersWhereClause(filters);
    const associateIdsClause = `d.associate_id IN (${normalizedAssociateIds
      .map(() => "?")
      .join(", ")})`;
    const clauses = [
      whereClause ? whereClause.replace(/^WHERE\s+/i, "") : "",
      associateIdsClause,
    ]
      .filter(Boolean)
      .join(" AND ");
    const rows = await this.database.query(
      buildDocumentSelect(`WHERE ${clauses}`),
      [...params, ...normalizedAssociateIds],
    );

    return rows.map(mapDocument);
  }

  async listPage(
    page: number,
    pageSize: number,
    filters?: DocumentRepositoryFilters,
  ): Promise<FleetDocument[]> {
    const normalizedPage = Math.max(1, Math.floor(page));
    const normalizedPageSize = Math.max(1, Math.min(100, Math.floor(pageSize)));
    const offset = (normalizedPage - 1) * normalizedPageSize;
    const { whereClause, params } = buildFiltersWhereClause(filters);
    const rows = await this.database.query(
      buildDocumentSelect(whereClause, "LIMIT ? OFFSET ?"),
      [...params, normalizedPageSize, offset],
    );

    return rows.map(mapDocument);
  }

  async summarizeByDueDate(
    filters?: DocumentRepositoryFilters,
    now = new Date(),
  ): Promise<DocumentDueSummary> {
    const today = formatUtcDateOnly(now);
    const dueIn15DaysThreshold = formatUtcDateOnly(addUtcDays(now, 15));
    const dueIn30DaysThreshold = getDocumentAttentionThresholdDate(now);
    const { whereClause, params } = buildFiltersWhereClause(filters);
    const row = await this.database.queryOne(
      `
        SELECT
          COUNT(*),
          COALESCE(SUM(CASE WHEN d.due_date < ? THEN 1 ELSE 0 END), 0),
          COALESCE(
            SUM(CASE WHEN d.due_date >= ? AND d.due_date <= ? THEN 1 ELSE 0 END),
            0
          ),
          COALESCE(
            SUM(CASE WHEN d.due_date > ? AND d.due_date <= ? THEN 1 ELSE 0 END),
            0
          )
        FROM documents d
        LEFT JOIN associate_profiles ap
          ON ap.associate_id = d.associate_id
        ${whereClause}
      `,
      [
        today,
        today,
        dueIn15DaysThreshold,
        dueIn15DaysThreshold,
        dueIn30DaysThreshold,
        ...params,
      ],
    );

    return {
      total: readSingleNumber(row?.[0]),
      expired: readSingleNumber(row?.[1]),
      dueIn15Days: readSingleNumber(row?.[2]),
      dueIn30Days: readSingleNumber(row?.[3]),
    };
  }

  async listRecent(
    limit = 6,
    filters?: DocumentRepositoryFilters,
  ): Promise<FleetDocument[]> {
    const { whereClause, params } = buildFiltersWhereClause(filters);
    const rows = await this.database.query(
      buildDocumentSelect(whereClause, "LIMIT ?"),
      [...params, limit],
    );

    return rows.map(mapDocument);
  }

  async listRequiringAttention(
    now = new Date(),
    filters?: DocumentRepositoryFilters,
  ): Promise<FleetDocument[]> {
    const attentionThresholdDate = getDocumentAttentionThresholdDate(now);
    const { whereClause, params } = buildFiltersWhereClause(filters);
    const clauses = [whereClause ? whereClause.replace(/^WHERE\s+/i, "") : "", "d.due_date <= ?"]
      .filter(Boolean)
      .join(" AND ");
    const rows = await this.database.query(
      buildDocumentSelect(clauses ? `WHERE ${clauses}` : ""),
      [...params, attentionThresholdDate],
    );

    return rows.map(mapDocument);
  }

  async findById(documentId: string): Promise<FleetDocument | null> {
    const row = await this.database.queryOne(
      buildDocumentSelect("WHERE d.id = ?", "LIMIT 1"),
      [documentId],
    );

    return row ? mapDocument(row) : null;
  }

  async findByAssociateId(
    associateId: string,
    filters?: Omit<DocumentRepositoryFilters, "associateId">,
  ): Promise<FleetDocument[]> {
    return this.listAll({
      ...filters,
      associateId,
    });
  }

  async findByAssociateAndType(
    associateId: string,
    documentType: DocumentType,
  ): Promise<FleetDocument | null> {
    return queryUniqueAssociateDocument(this.database, associateId, documentType);
  }

  async create(input: CreateDocumentInput): Promise<FleetDocument> {
    return this.database.write(async (session) => {
      const associateId = input.associateId.trim();
      const existingDocument = await queryUniqueAssociateDocument(
        session,
        associateId,
        input.documentType,
      );
      const document: FleetDocument = {
        id: existingDocument?.id ?? randomUUID(),
        name: getDocumentTypeLabel(input.documentType),
        owner: input.owner.trim(),
        documentType: input.documentType,
        status: calculateDocumentStatus(input.dueDate),
        dueDate: input.dueDate,
        associateId,
        notes: normalizeNullable(input.notes ?? null),
        associateName: null,
        associateRegistrationNumber: null,
        associateCategory: null,
      };

      if (existingDocument) {
        await session.execute(
          `
            UPDATE documents
            SET
              name = ?,
              owner = ?,
              type = ?,
              status = ?,
              due_date = ?,
              associate_id = ?,
              notes = ?
            WHERE id = ?
          `,
          [
            document.name,
            document.owner,
            document.documentType,
            document.status,
            document.dueDate,
            document.associateId,
            document.notes,
            document.id,
          ],
        );
      } else {
        await session.execute(
          `
            INSERT INTO documents (
              id,
              name,
              owner,
              type,
              status,
              due_date,
              associate_id,
              notes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            document.id,
            document.name,
            document.owner,
            document.documentType,
            document.status,
            document.dueDate,
            document.associateId,
            document.notes,
          ],
        );
      }

      const createdRow = await session.queryOne(
        buildDocumentSelect("WHERE d.id = ?", "LIMIT 1"),
        [document.id],
      );
      const created = createdRow ? mapDocument(createdRow) : null;

      if (!created) {
        throw new Error("DOCUMENT_NOT_FOUND_AFTER_CREATE");
      }

      logger.info("data.documents.create.success", {
        documentId: document.id,
        associateId: document.associateId,
        documentType: document.documentType,
        status: document.status,
        action: existingDocument ? "updated" : "created",
      });

      return created;
    });
  }

  async update(documentId: string, input: UpdateDocumentInput): Promise<FleetDocument> {
    return this.database.write(async (session) => {
      const existingRow = await session.queryOne(
        buildDocumentSelect("WHERE d.id = ?", "LIMIT 1"),
        [documentId],
      );

      if (!existingRow) {
        throw new Error("DOCUMENT_NOT_FOUND");
      }

      const existing = mapDocument(existingRow);
      const notes = normalizeNullable(input.notes ?? null);

      await session.execute(
        `
          UPDATE documents
          SET due_date = ?, notes = ?, status = ?
          WHERE id = ?
        `,
        [
          input.dueDate,
          notes,
          calculateDocumentStatus(input.dueDate),
          documentId,
        ],
      );

      const updated: FleetDocument = {
        ...existing,
        dueDate: input.dueDate,
        notes,
        status: calculateDocumentStatus(input.dueDate),
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

  async countAll(filters?: DocumentRepositoryFilters): Promise<number> {
    const { whereClause, params } = buildFiltersWhereClause(filters);

    return readSingleNumber(
      await this.database.queryValue(
        `
          SELECT COUNT(*)
          FROM documents d
          LEFT JOIN associate_profiles ap
            ON ap.associate_id = d.associate_id
          ${whereClause}
        `,
        params,
      ),
    );
  }

  async countPending(
    now = new Date(),
    filters?: DocumentRepositoryFilters,
  ): Promise<number> {
    const attentionThresholdDate = getDocumentAttentionThresholdDate(now);
    const { whereClause, params } = buildFiltersWhereClause(filters);
    const clauses = [whereClause ? whereClause.replace(/^WHERE\s+/i, "") : "", "d.due_date <= ?"]
      .filter(Boolean)
      .join(" AND ");

    return readSingleNumber(
      await this.database.queryValue(
        `
          SELECT COUNT(*)
          FROM documents d
          LEFT JOIN associate_profiles ap
            ON ap.associate_id = d.associate_id
          ${clauses ? `WHERE ${clauses}` : ""}
        `,
        [...params, attentionThresholdDate],
      ),
    );
  }

  async countAttention(
    now = new Date(),
    filters?: DocumentRepositoryFilters,
  ): Promise<number> {
    const today = formatUtcDateOnly(now);
    const attentionThresholdDate = getDocumentAttentionThresholdDate(now);
    const { whereClause, params } = buildFiltersWhereClause(filters);
    const clauses = [
      whereClause ? whereClause.replace(/^WHERE\s+/i, "") : "",
      "d.due_date >= ?",
      "d.due_date <= ?",
    ]
      .filter(Boolean)
      .join(" AND ");

    return readSingleNumber(
      await this.database.queryValue(
        `
          SELECT COUNT(*)
          FROM documents d
          LEFT JOIN associate_profiles ap
            ON ap.associate_id = d.associate_id
          ${clauses ? `WHERE ${clauses}` : ""}
        `,
        [...params, today, attentionThresholdDate],
      ),
    );
  }

  async groupByType(
    now = new Date(),
    limit = 5,
    filters?: DocumentRepositoryFilters,
  ): Promise<DocumentTypeStatusSummary[]> {
    const today = formatUtcDateOnly(now);
    const attentionThresholdDate = getDocumentAttentionThresholdDate(now);
    const { fromClause, params } = buildFilteredDocumentFromClause(filters);
    const rows = await this.database.query(
      `
        SELECT
          d.type,
          COALESCE(SUM(CASE WHEN d.due_date > ? THEN 1 ELSE 0 END), 0),
          COALESCE(
            SUM(CASE WHEN d.due_date >= ? AND d.due_date <= ? THEN 1 ELSE 0 END),
            0
          ),
          COALESCE(SUM(CASE WHEN d.due_date < ? THEN 1 ELSE 0 END), 0),
          COUNT(*)
        ${fromClause}
        GROUP BY d.type
        ORDER BY COUNT(*) DESC, d.type ASC
        LIMIT ?
      `,
      [
        attentionThresholdDate,
        today,
        attentionThresholdDate,
        today,
        ...params,
        Math.max(1, Math.floor(limit)),
      ],
    );

    return rows.map((row) => ({
      documentType: normalizeDocumentType(String(row[0])),
      valid: readSingleNumber(row[1]),
      attention: readSingleNumber(row[2]),
      expired: readSingleNumber(row[3]),
      total: readSingleNumber(row[4]),
    }));
  }

  async summarizeExpirationTimeline(
    now = new Date(),
    filters?: DocumentRepositoryFilters,
    monthsBack = 2,
    monthsForward = 4,
  ): Promise<DocumentTimelineBucket[]> {
    const normalizedMonthsBack = Math.max(0, Math.floor(monthsBack));
    const normalizedMonthsForward = Math.max(0, Math.floor(monthsForward));
    const startDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - normalizedMonthsBack, 1),
    );
    const endDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + normalizedMonthsForward + 1, 0),
    );
    const start = formatUtcDateOnly(startDate);
    const end = formatUtcDateOnly(endDate);
    const { fromClause, params } = buildFilteredDocumentFromClause(filters);
    const rows = await this.database.query(
      `
        SELECT
          SUBSTR(d.due_date, 1, 7) AS bucket,
          COUNT(*)
        ${fromClause}
        ${fromClause.includes("WHERE") ? "AND" : "WHERE"} d.due_date >= ? AND d.due_date <= ?
        GROUP BY SUBSTR(d.due_date, 1, 7)
        ORDER BY bucket ASC
      `,
      [...params, start, end],
    );

    return rows.map((row) => ({
      bucket: String(row[0]),
      total: readSingleNumber(row[1]),
    }));
  }
}

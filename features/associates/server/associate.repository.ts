import { randomUUID } from "node:crypto";
import type { DatabaseAdapter, DatabaseRow } from "@/lib/database/adapter";
import { getDatabaseAdapter } from "@/lib/database/provider";
import {
  associateCategories,
  associateStatuses,
} from "@/features/associates/constants";
import type {
  Associate,
  AssociateCategory,
  AssociateCategoryCounts,
  AssociateFilters,
  AssociateStatusCounts,
  AssociateStatus,
  CreateAssociateInput,
  UpdateAssociateInput,
} from "@/features/associates/types";

type AssociateRecord = {
  id: string;
  name: string;
  cpf: string;
  category: AssociateCategory;
  registration_number: string;
  status: AssociateStatus;
  admission_date: string;
  created_at: string;
  updated_at: string;
};

export interface AssociateRepository {
  findMany(filters?: AssociateFilters): Promise<Associate[]>;
  findById(id: string): Promise<Associate | null>;
  findByCpf(cpf: string): Promise<Associate | null>;
  findByRegistrationNumber(registrationNumber: string): Promise<Associate | null>;
  countAll(): Promise<number>;
  countByStatus(): Promise<AssociateStatusCounts>;
  countByCategory(): Promise<AssociateCategoryCounts>;
  create(data: CreateAssociateInput): Promise<Associate>;
  update(id: string, data: UpdateAssociateInput): Promise<Associate>;
  remove(id: string): Promise<void>;
}

function normalizeCpf(value: string) {
  return value.replace(/\D/g, "");
}

function normalizeText(value: string) {
  return value.trim();
}

function mapAssociate(row: DatabaseRow): Associate {
  const record: AssociateRecord = {
    id: String(row[0]),
    name: String(row[1]),
    cpf: String(row[2]),
    category: row[3] as AssociateCategory,
    registration_number: String(row[4]),
    status: row[5] as AssociateStatus,
    admission_date: String(row[6]),
    created_at: String(row[7]),
    updated_at: String(row[8]),
  };

  return {
    id: record.id,
    name: record.name,
    cpf: record.cpf,
    category: record.category,
    registrationNumber: record.registration_number,
    status: record.status,
    admissionDate: record.admission_date,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

function buildFiltersWhereClause(filters?: AssociateFilters) {
  const clauses: string[] = [];
  const params: unknown[] = [];

  if (!filters) {
    return { whereClause: "", params };
  }

  if (filters.search?.trim()) {
    const normalizedSearch = `%${filters.search.trim()}%`;
    clauses.push("(name LIKE ? OR registration_number LIKE ?)");
    params.push(normalizedSearch, normalizedSearch);
  }

  if (filters.cpf?.trim()) {
    clauses.push("cpf = ?");
    params.push(normalizeCpf(filters.cpf));
  }

  if (filters.category) {
    clauses.push("category = ?");
    params.push(filters.category);
  }

  if (filters.status) {
    clauses.push("status = ?");
    params.push(filters.status);
  }

  if (filters.registrationNumber?.trim()) {
    clauses.push("registration_number = ?");
    params.push(normalizeText(filters.registrationNumber));
  }

  if (filters.admissionDateFrom?.trim()) {
    clauses.push("admission_date >= ?");
    params.push(filters.admissionDateFrom.trim());
  }

  if (filters.admissionDateTo?.trim()) {
    clauses.push("admission_date <= ?");
    params.push(filters.admissionDateTo.trim());
  }

  return {
    whereClause: clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "",
    params,
  };
}

function buildSelectQuery(whereClause: string) {
  return `
    SELECT
      id,
      name,
      cpf,
      category,
      registration_number,
      status,
      admission_date,
      created_at,
      updated_at
    FROM associates
    ${whereClause}
  `;
}

function createEmptyStatusCounts(): AssociateStatusCounts {
  return Object.fromEntries(
    associateStatuses.map((status) => [status, 0]),
  ) as AssociateStatusCounts;
}

function createEmptyCategoryCounts(): AssociateCategoryCounts {
  return Object.fromEntries(
    associateCategories.map((category) => [category, 0]),
  ) as AssociateCategoryCounts;
}

export class SqliteAssociateRepository implements AssociateRepository {
  constructor(private readonly database: DatabaseAdapter = getDatabaseAdapter()) {}

  async findMany(filters?: AssociateFilters): Promise<Associate[]> {
    const { whereClause, params } = buildFiltersWhereClause(filters);
    const page = Math.max(1, filters?.page ?? 1);
    const pageSize = Math.max(1, Math.min(100, filters?.pageSize ?? 20));
    const offset = (page - 1) * pageSize;

    const rows = await this.database.query(
      `
        ${buildSelectQuery(whereClause)}
        ORDER BY name ASC
        LIMIT ? OFFSET ?
      `,
      [...params, pageSize, offset],
    );

    return rows.map(mapAssociate);
  }

  async findById(id: string): Promise<Associate | null> {
    const row = await this.database.queryOne(
      `
        ${buildSelectQuery("WHERE id = ?")}
        LIMIT 1
      `,
      [id],
    );

    return row ? mapAssociate(row) : null;
  }

  async findByCpf(cpf: string): Promise<Associate | null> {
    const row = await this.database.queryOne(
      `
        ${buildSelectQuery("WHERE cpf = ?")}
        LIMIT 1
      `,
      [normalizeCpf(cpf)],
    );

    return row ? mapAssociate(row) : null;
  }

  async findByRegistrationNumber(registrationNumber: string): Promise<Associate | null> {
    const row = await this.database.queryOne(
      `
        ${buildSelectQuery("WHERE registration_number = ?")}
        LIMIT 1
      `,
      [normalizeText(registrationNumber)],
    );

    return row ? mapAssociate(row) : null;
  }

  async countAll(): Promise<number> {
    const total = await this.database.queryValue("SELECT COUNT(*) FROM associates");

    return Number(total ?? 0);
  }

  async countByStatus(): Promise<AssociateStatusCounts> {
    const rows = await this.database.query(
      `
        SELECT status, COUNT(*)
        FROM associates
        GROUP BY status
      `,
    );

    const counts = createEmptyStatusCounts();

    for (const row of rows) {
      const status = row[0] as AssociateStatus;
      const total = Number(row[1] ?? 0);

      if (status in counts) {
        counts[status] = total;
      }
    }

    return counts;
  }

  async countByCategory(): Promise<AssociateCategoryCounts> {
    const rows = await this.database.query(
      `
        SELECT category, COUNT(*)
        FROM associates
        GROUP BY category
      `,
    );

    const counts = createEmptyCategoryCounts();

    for (const row of rows) {
      const category = row[0] as AssociateCategory;
      const total = Number(row[1] ?? 0);

      if (category in counts) {
        counts[category] = total;
      }
    }

    return counts;
  }

  async create(data: CreateAssociateInput): Promise<Associate> {
    return this.database.write(async (session) => {
      const now = new Date().toISOString();
      const associate: Associate = {
        id: randomUUID(),
        name: normalizeText(data.name),
        cpf: normalizeCpf(data.cpf),
        category: data.category,
        registrationNumber: normalizeText(data.registrationNumber),
        status: data.status,
        admissionDate: data.admissionDate.trim(),
        createdAt: now,
        updatedAt: now,
      };

      await session.execute(
        `
          INSERT INTO associates (
            id,
            name,
            cpf,
            category,
            registration_number,
            status,
            admission_date,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          associate.id,
          associate.name,
          associate.cpf,
          associate.category,
          associate.registrationNumber,
          associate.status,
          associate.admissionDate,
          associate.createdAt,
          associate.updatedAt,
        ],
      );

      return associate;
    });
  }

  async update(id: string, data: UpdateAssociateInput): Promise<Associate> {
    return this.database.write(async (session) => {
      const existing = await session.queryOne(
        `
          ${buildSelectQuery("WHERE id = ?")}
          LIMIT 1
        `,
        [id],
      );

      if (!existing) {
        throw new Error("ASSOCIATE_NOT_FOUND");
      }

      const current = mapAssociate(existing);
      const updated: Associate = {
        ...current,
        name: data.name !== undefined ? normalizeText(data.name) : current.name,
        cpf: data.cpf !== undefined ? normalizeCpf(data.cpf) : current.cpf,
        category: data.category ?? current.category,
        registrationNumber:
          data.registrationNumber !== undefined
            ? normalizeText(data.registrationNumber)
            : current.registrationNumber,
        status: data.status ?? current.status,
        admissionDate:
          data.admissionDate !== undefined
            ? data.admissionDate.trim()
            : current.admissionDate,
        updatedAt: new Date().toISOString(),
      };

      await session.execute(
        `
          UPDATE associates
          SET
            name = ?,
            cpf = ?,
            category = ?,
            registration_number = ?,
            status = ?,
            admission_date = ?,
            updated_at = ?
          WHERE id = ?
        `,
        [
          updated.name,
          updated.cpf,
          updated.category,
          updated.registrationNumber,
          updated.status,
          updated.admissionDate,
          updated.updatedAt,
          id,
        ],
      );

      return updated;
    });
  }

  async remove(id: string): Promise<void> {
    return this.database.write(async (session) => {
      const existingCount = Number(
        (await session.queryValue("SELECT COUNT(*) FROM associates WHERE id = ?", [id])) ?? 0,
      );

      if (existingCount === 0) {
        throw new Error("ASSOCIATE_NOT_FOUND");
      }

      await session.execute("DELETE FROM associates WHERE id = ?", [id]);
    });
  }
}


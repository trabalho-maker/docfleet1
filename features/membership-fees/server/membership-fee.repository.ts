import { randomUUID } from "node:crypto";
import type { DatabaseAdapter, DatabaseRow } from "@/lib/database/adapter";
import { getDatabaseAdapter } from "@/lib/database/provider";
import type {
  MembershipFeePayment,
  MembershipFeeSheet,
  MembershipFeeSheetStatus,
} from "@/features/membership-fees/types";

type MembershipFeeSheetRecord = {
  id: string;
  associate_id: string;
  reference_year: number;
  status: MembershipFeeSheetStatus;
  snapshot_name: string | null;
  snapshot_address: string | null;
  snapshot_category: string | null;
  snapshot_phone: string | null;
  snapshot_registration_suffix: string | null;
  snapshot_inss: string | null;
  created_at: string;
  updated_at: string;
};

type MembershipFeePaymentRecord = {
  id: string;
  sheet_id: string;
  associate_id: string;
  competence_year: number;
  competence_month: number;
  paid_at: string;
  paid_by_user_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export interface MembershipFeeRepository {
  findSheetByAssociateIdAndYear(
    associateId: string,
    referenceYear: number,
  ): Promise<MembershipFeeSheet | null>;
  listSheetsByAssociateId(associateId: string): Promise<MembershipFeeSheet[]>;
  listSheetYearsByAssociateId(associateId: string): Promise<number[]>;
  createSheet(input: {
    associateId: string;
    referenceYear: number;
    status: MembershipFeeSheetStatus;
    snapshotName?: string | null;
    snapshotAddress?: string | null;
    snapshotCategory?: string | null;
    snapshotPhone?: string | null;
    snapshotRegistrationSuffix?: string | null;
    snapshotInss?: string | null;
  }): Promise<MembershipFeeSheet>;
  archiveSheetsByAssociateId(associateId: string): Promise<void>;
  activateSheet(sheetId: string): Promise<void>;
  findPaymentsBySheetId(sheetId: string): Promise<MembershipFeePayment[]>;
  findPaymentsByAssociateId(associateId: string): Promise<MembershipFeePayment[]>;
  findPaymentByCompetence(
    associateId: string,
    competenceYear: number,
    competenceMonth: number,
  ): Promise<MembershipFeePayment | null>;
  createPayment(input: {
    sheetId: string;
    associateId: string;
    competenceYear: number;
    competenceMonth: number;
    paidAt: string;
    paidByUserId?: string | null;
    notes?: string | null;
  }): Promise<MembershipFeePayment>;
}

function normalizeNullableText(value: string | null | undefined) {
  if (value == null) {
    return null;
  }

  const normalizedValue = value.trim();
  return normalizedValue ? normalizedValue : null;
}

function mapSheet(row: DatabaseRow): MembershipFeeSheet {
  const record: MembershipFeeSheetRecord = {
    id: String(row[0]),
    associate_id: String(row[1]),
    reference_year: Number(row[2]),
    status: row[3] as MembershipFeeSheetStatus,
    snapshot_name: normalizeNullableText(row[4] == null ? null : String(row[4])),
    snapshot_address: normalizeNullableText(row[5] == null ? null : String(row[5])),
    snapshot_category: normalizeNullableText(row[6] == null ? null : String(row[6])),
    snapshot_phone: normalizeNullableText(row[7] == null ? null : String(row[7])),
    snapshot_registration_suffix: normalizeNullableText(
      row[8] == null ? null : String(row[8]),
    ),
    snapshot_inss: normalizeNullableText(row[9] == null ? null : String(row[9])),
    created_at: String(row[10]),
    updated_at: String(row[11]),
  };

  return {
    id: record.id,
    associateId: record.associate_id,
    referenceYear: record.reference_year,
    status: record.status,
    snapshotName: record.snapshot_name,
    snapshotAddress: record.snapshot_address,
    snapshotCategory: record.snapshot_category,
    snapshotPhone: record.snapshot_phone,
    snapshotRegistrationSuffix: record.snapshot_registration_suffix,
    snapshotInss: record.snapshot_inss,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

function mapPayment(row: DatabaseRow): MembershipFeePayment {
  const record: MembershipFeePaymentRecord = {
    id: String(row[0]),
    sheet_id: String(row[1]),
    associate_id: String(row[2]),
    competence_year: Number(row[3]),
    competence_month: Number(row[4]),
    paid_at: String(row[5]),
    paid_by_user_id: normalizeNullableText(row[6] == null ? null : String(row[6])),
    notes: normalizeNullableText(row[7] == null ? null : String(row[7])),
    created_at: String(row[8]),
    updated_at: String(row[9]),
  };

  return {
    id: record.id,
    sheetId: record.sheet_id,
    associateId: record.associate_id,
    competenceYear: record.competence_year,
    competenceMonth: record.competence_month,
    paidAt: record.paid_at,
    paidByUserId: record.paid_by_user_id,
    notes: record.notes,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

export class SqliteMembershipFeeRepository implements MembershipFeeRepository {
  constructor(private readonly database: DatabaseAdapter = getDatabaseAdapter()) {}

  async findSheetByAssociateIdAndYear(
    associateId: string,
    referenceYear: number,
  ): Promise<MembershipFeeSheet | null> {
    const row = await this.database.queryOne(
      `
        SELECT
          id,
          associate_id,
          reference_year,
          status,
          snapshot_name,
          snapshot_address,
          snapshot_category,
          snapshot_phone,
          snapshot_registration_suffix,
          snapshot_inss,
          created_at,
          updated_at
        FROM membership_fee_sheets
        WHERE associate_id = ? AND reference_year = ?
        LIMIT 1
      `,
      [associateId, referenceYear],
    );

    return row ? mapSheet(row) : null;
  }

  async listSheetsByAssociateId(associateId: string): Promise<MembershipFeeSheet[]> {
    const rows = await this.database.query(
      `
        SELECT
          id,
          associate_id,
          reference_year,
          status,
          snapshot_name,
          snapshot_address,
          snapshot_category,
          snapshot_phone,
          snapshot_registration_suffix,
          snapshot_inss,
          created_at,
          updated_at
        FROM membership_fee_sheets
        WHERE associate_id = ?
        ORDER BY reference_year DESC
      `,
      [associateId],
    );

    return rows.map(mapSheet);
  }

  async listSheetYearsByAssociateId(associateId: string): Promise<number[]> {
    const rows = await this.database.query(
      `
        SELECT reference_year
        FROM membership_fee_sheets
        WHERE associate_id = ?
        ORDER BY reference_year DESC
      `,
      [associateId],
    );

    return rows.map((row) => Number(row[0]));
  }

  async createSheet(input: {
    associateId: string;
    referenceYear: number;
    status: MembershipFeeSheetStatus;
    snapshotName?: string | null;
    snapshotAddress?: string | null;
    snapshotCategory?: string | null;
    snapshotPhone?: string | null;
    snapshotRegistrationSuffix?: string | null;
    snapshotInss?: string | null;
  }): Promise<MembershipFeeSheet> {
    return this.database.write(async (session) => {
      const now = new Date().toISOString();
      const sheet: MembershipFeeSheet = {
        id: randomUUID(),
        associateId: input.associateId.trim(),
        referenceYear: input.referenceYear,
        status: input.status,
        snapshotName: normalizeNullableText(input.snapshotName),
        snapshotAddress: normalizeNullableText(input.snapshotAddress),
        snapshotCategory: normalizeNullableText(input.snapshotCategory),
        snapshotPhone: normalizeNullableText(input.snapshotPhone),
        snapshotRegistrationSuffix: normalizeNullableText(
          input.snapshotRegistrationSuffix,
        ),
        snapshotInss: normalizeNullableText(input.snapshotInss),
        createdAt: now,
        updatedAt: now,
      };

      await session.execute(
        `
          INSERT INTO membership_fee_sheets (
            id,
            associate_id,
            reference_year,
            status,
            snapshot_name,
            snapshot_address,
            snapshot_category,
            snapshot_phone,
            snapshot_registration_suffix,
            snapshot_inss,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          sheet.id,
          sheet.associateId,
          sheet.referenceYear,
          sheet.status,
          sheet.snapshotName,
          sheet.snapshotAddress,
          sheet.snapshotCategory,
          sheet.snapshotPhone,
          sheet.snapshotRegistrationSuffix,
          sheet.snapshotInss,
          sheet.createdAt,
          sheet.updatedAt,
        ],
      );

      return sheet;
    });
  }

  async archiveSheetsByAssociateId(associateId: string): Promise<void> {
    await this.database.write(async (session) => {
      await session.execute(
        `
          UPDATE membership_fee_sheets
          SET status = 'archived', updated_at = ?
          WHERE associate_id = ? AND status <> 'archived'
        `,
        [new Date().toISOString(), associateId],
      );
    });
  }

  async activateSheet(sheetId: string): Promise<void> {
    await this.database.write(async (session) => {
      await session.execute(
        `
          UPDATE membership_fee_sheets
          SET status = 'active', updated_at = ?
          WHERE id = ?
        `,
        [new Date().toISOString(), sheetId],
      );
    });
  }

  async findPaymentsBySheetId(sheetId: string): Promise<MembershipFeePayment[]> {
    const rows = await this.database.query(
      `
        SELECT
          id,
          sheet_id,
          associate_id,
          competence_year,
          competence_month,
          paid_at,
          paid_by_user_id,
          notes,
          created_at,
          updated_at
        FROM membership_fee_payments
        WHERE sheet_id = ?
        ORDER BY competence_year ASC, competence_month ASC, paid_at ASC
      `,
      [sheetId],
    );

    return rows.map(mapPayment);
  }

  async findPaymentsByAssociateId(
    associateId: string,
  ): Promise<MembershipFeePayment[]> {
    const rows = await this.database.query(
      `
        SELECT
          id,
          sheet_id,
          associate_id,
          competence_year,
          competence_month,
          paid_at,
          paid_by_user_id,
          notes,
          created_at,
          updated_at
        FROM membership_fee_payments
        WHERE associate_id = ?
        ORDER BY competence_year ASC, competence_month ASC, paid_at ASC
      `,
      [associateId],
    );

    return rows.map(mapPayment);
  }

  async findPaymentByCompetence(
    associateId: string,
    competenceYear: number,
    competenceMonth: number,
  ): Promise<MembershipFeePayment | null> {
    const row = await this.database.queryOne(
      `
        SELECT
          id,
          sheet_id,
          associate_id,
          competence_year,
          competence_month,
          paid_at,
          paid_by_user_id,
          notes,
          created_at,
          updated_at
        FROM membership_fee_payments
        WHERE associate_id = ?
          AND competence_year = ?
          AND competence_month = ?
        LIMIT 1
      `,
      [associateId, competenceYear, competenceMonth],
    );

    return row ? mapPayment(row) : null;
  }

  async createPayment(input: {
    sheetId: string;
    associateId: string;
    competenceYear: number;
    competenceMonth: number;
    paidAt: string;
    paidByUserId?: string | null;
    notes?: string | null;
  }): Promise<MembershipFeePayment> {
    return this.database.write(async (session) => {
      const now = new Date().toISOString();
      const payment: MembershipFeePayment = {
        id: randomUUID(),
        sheetId: input.sheetId.trim(),
        associateId: input.associateId.trim(),
        competenceYear: input.competenceYear,
        competenceMonth: input.competenceMonth,
        paidAt: input.paidAt,
        paidByUserId: normalizeNullableText(input.paidByUserId ?? null),
        notes: normalizeNullableText(input.notes ?? null),
        createdAt: now,
        updatedAt: now,
      };

      await session.execute(
        `
          INSERT INTO membership_fee_payments (
            id,
            sheet_id,
            associate_id,
            competence_year,
            competence_month,
            paid_at,
            paid_by_user_id,
            notes,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          payment.id,
          payment.sheetId,
          payment.associateId,
          payment.competenceYear,
          payment.competenceMonth,
          payment.paidAt,
          payment.paidByUserId,
          payment.notes,
          payment.createdAt,
          payment.updatedAt,
        ],
      );

      return payment;
    });
  }
}


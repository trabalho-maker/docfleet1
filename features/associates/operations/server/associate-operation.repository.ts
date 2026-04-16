import type { DatabaseAdapter, DatabaseRow } from "@/lib/database/adapter";
import { getDatabaseAdapter } from "@/lib/database/provider";
import { createEmptyAssociateProfile } from "@/features/associates/server/associate-profile.repository";
import type { Associate } from "@/features/associates/types";
import type {
  AssociateOperationProfile,
  AssociateOperationType,
} from "@/features/associates/operations/types";

type AssociateOperationRow = {
  associateId: string;
  operationType: AssociateOperationType;
  basicDocumentationDueDate: string | null;
  vehicleAuthorizationDueDate: string | null;
  driverAuthorizationDueDate: string | null;
  cargoLicensingDueDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AssociateOperationRecord = {
  associate: Associate;
  profile: AssociateOperationProfile;
};

export interface AssociateOperationRepository {
  findByOperationType(
    operationType: AssociateOperationType,
  ): Promise<AssociateOperationRecord[]>;
}

function normalizeNullableDate(value: unknown) {
  const normalized = value == null ? null : String(value).trim();
  return normalized ? normalized : null;
}

function mapAssociateOperationRow(row: DatabaseRow): AssociateOperationRecord {
  const associate: Associate = {
    id: String(row[0]),
    name: String(row[1]),
    cpf: String(row[2]),
    category: row[3] as Associate["category"],
    registrationNumber: String(row[4]),
    status: row[5] as Associate["status"],
    admissionDate: String(row[6]),
    createdAt: String(row[7]),
    updatedAt: String(row[8]),
    ...createEmptyAssociateProfile(),
  };

  const profileRow: AssociateOperationRow = {
    associateId: String(row[9]),
    operationType: row[10] as AssociateOperationType,
    basicDocumentationDueDate: normalizeNullableDate(row[11]),
    vehicleAuthorizationDueDate: normalizeNullableDate(row[12]),
    driverAuthorizationDueDate: normalizeNullableDate(row[13]),
    cargoLicensingDueDate: normalizeNullableDate(row[14]),
    createdAt: String(row[15]),
    updatedAt: String(row[16]),
  };

  return {
    associate,
    profile: {
      associateId: profileRow.associateId,
      operationType: profileRow.operationType,
      basicDocumentationDueDate: profileRow.basicDocumentationDueDate,
      vehicleAuthorizationDueDate: profileRow.vehicleAuthorizationDueDate,
      driverAuthorizationDueDate: profileRow.driverAuthorizationDueDate,
      cargoLicensingDueDate: profileRow.cargoLicensingDueDate,
      createdAt: profileRow.createdAt,
      updatedAt: profileRow.updatedAt,
    },
  };
}

export class SqliteAssociateOperationRepository
  implements AssociateOperationRepository
{
  constructor(private readonly database: DatabaseAdapter = getDatabaseAdapter()) {}

  async findByOperationType(
    operationType: AssociateOperationType,
  ): Promise<AssociateOperationRecord[]> {
    const rows = await this.database.query(
      `
        SELECT
          a.id,
          a.name,
          a.cpf,
          a.category,
          a.registration_number,
          a.status,
          a.admission_date,
          a.created_at,
          a.updated_at,
          p.associate_id,
          p.operation_type,
          p.basic_documentation_due_date,
          p.vehicle_authorization_due_date,
          p.driver_authorization_due_date,
          p.cargo_licensing_due_date,
          p.created_at,
          p.updated_at
        FROM associate_operation_profiles p
        INNER JOIN associates a
          ON a.id = p.associate_id
        WHERE p.operation_type = ?
        ORDER BY a.name ASC
      `,
      [operationType],
    );

    return rows.map(mapAssociateOperationRow);
  }
}

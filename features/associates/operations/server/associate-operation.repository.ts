import type { DatabaseAdapter, DatabaseRow } from "@/lib/database/adapter";
import { getDatabaseAdapter } from "@/lib/database/provider";
import type {
  AssociateOperationAssociate,
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
  associate: AssociateOperationAssociate;
  profile: AssociateOperationProfile;
};

export interface AssociateOperationRepository {
  findByOperationType(
    operationType: AssociateOperationType,
  ): Promise<AssociateOperationRecord[]>;
}

const operationProfileCategoryMap: Partial<
  Record<AssociateOperationType, "TAXI" | "CAMINHAO" | "ESCOLAR" | "CNPJ">
> = {
  Taxista: "TAXI",
  TransporteEscolar: "ESCOLAR",
  Caminhao: "CAMINHAO",
  Empresa: "CNPJ",
};

function normalizeNullableDate(value: unknown) {
  const normalized = value == null ? null : String(value).trim();
  return normalized ? normalized : null;
}

function mapAssociateOperationRow(row: DatabaseRow): AssociateOperationRecord {
  const associate: AssociateOperationAssociate = {
    id: String(row[0]),
    name: String(row[1]),
    category: row[2] as AssociateOperationAssociate["category"],
    registrationNumber: String(row[3]),
    status: row[4] as AssociateOperationAssociate["status"],
  };

  const profileRow: AssociateOperationRow = {
    associateId: String(row[5]),
    operationType: row[6] as AssociateOperationType,
    basicDocumentationDueDate: normalizeNullableDate(row[7]),
    vehicleAuthorizationDueDate: normalizeNullableDate(row[8]),
    driverAuthorizationDueDate: normalizeNullableDate(row[9]),
    cargoLicensingDueDate: normalizeNullableDate(row[10]),
    createdAt: String(row[11]),
    updatedAt: String(row[12]),
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
    const profileCategory = operationProfileCategoryMap[operationType];
    const rows =
      operationType === "Empresa"
        ? await this.database.query(
            `
              SELECT
                a.id,
                a.name,
                a.category,
                a.registration_number,
                a.status,
                a.id,
                ?,
                p.basic_documentation_due_date,
                p.vehicle_authorization_due_date,
                p.driver_authorization_due_date,
                p.cargo_licensing_due_date,
                COALESCE(p.created_at, ap.created_at),
                COALESCE(p.updated_at, ap.updated_at)
              FROM associate_profiles ap
              INNER JOIN associates a
                ON a.id = ap.associate_id
              LEFT JOIN associate_operation_profiles p
                ON p.associate_id = a.id
               AND p.operation_type = ?
              WHERE ap.modalidade_associado = 'CNPJ'
              ORDER BY a.name ASC
            `,
            [operationType, operationType],
          )
        : operationType === "Taxista"
          ? await this.database.query(
              `
                SELECT
                  a.id,
                  a.name,
                  a.category,
                  a.registration_number,
                  a.status,
                  COALESCE(p.associate_id, a.id),
                  COALESCE(p.operation_type, ?),
                  p.basic_documentation_due_date,
                  p.vehicle_authorization_due_date,
                  p.driver_authorization_due_date,
                  p.cargo_licensing_due_date,
                  COALESCE(p.created_at, ap.created_at),
                  COALESCE(p.updated_at, ap.updated_at)
                FROM associate_profiles ap
                INNER JOIN associates a
                  ON a.id = ap.associate_id
                LEFT JOIN associate_operation_profiles p
                  ON a.id = p.associate_id
                 AND p.operation_type = ?
                WHERE UPPER(COALESCE(ap.modalidade_associado, '')) = ?
                ORDER BY a.name ASC
              `,
              [operationType, operationType, profileCategory ?? ""],
            )
        : await this.database.query(
            `
              SELECT
                a.id,
                a.name,
                a.category,
                a.registration_number,
                a.status,
                COALESCE(p.associate_id, a.id),
                COALESCE(p.operation_type, ?),
                p.basic_documentation_due_date,
                p.vehicle_authorization_due_date,
                p.driver_authorization_due_date,
                p.cargo_licensing_due_date,
                COALESCE(p.created_at, ap.created_at),
                COALESCE(p.updated_at, ap.updated_at)
              FROM associates a
              LEFT JOIN associate_profiles ap
                ON ap.associate_id = a.id
              LEFT JOIN associate_operation_profiles p
                ON a.id = p.associate_id
               AND p.operation_type = ?
              WHERE (
                p.operation_type = ?
                OR UPPER(COALESCE(ap.modalidade_associado, '')) = ?
              )
              ORDER BY a.name ASC
            `,
            [operationType, operationType, operationType, profileCategory ?? ""],
          );

    return rows.map(mapAssociateOperationRow);
  }
}

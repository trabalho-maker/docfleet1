import type { AssociateProfileCategory } from "@/features/associates/types";
import type { DocumentType } from "@/features/documents/constants";

export type DocumentStatus = "Valido" | "Atencao" | "Vencido";

export const documentStatuses: DocumentStatus[] = [
  "Valido",
  "Atencao",
  "Vencido",
];

export type FleetDocument = {
  id: string;
  name: string;
  owner: string;
  documentType: DocumentType;
  status: DocumentStatus;
  dueDate: string;
  associateId: string | null;
  associateName: string | null;
  associateRegistrationNumber: string | null;
  associateCategory: AssociateProfileCategory | null;
  notes: string | null;
};

export type CreateDocumentInput = {
  associateId: string;
  documentType: DocumentType;
  dueDate: string;
  owner: string;
  notes?: string | null;
};

export type UpdateDocumentInput = {
  dueDate: string;
  notes?: string | null;
};

export type OperationalAlert = {
  id: string;
  title: string;
  severity: "Alta" | "Media" | "Baixa";
  team: string;
  createdAt: string;
  kind?: "manual" | "operational" | "document_expiration";
  sourceDocumentId?: string | null;
};

export type GeneratedOperationalAlertInput = {
  title: string;
  severity: OperationalAlert["severity"];
  team: string;
  createdAt: string;
  sourceDocumentId: string;
  kind: "document_expiration";
};

export type DashboardMetric = {
  label: string;
  value: string;
  helper: string;
};

export type StoredUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  passwordHash: string;
};

export type NewUserInput = {
  name: string;
  email: string;
  password: string;
};

export type PasswordResetTokenRecord = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
  consumedAt: string | null;
};

export type PasswordResetTokenWithUser = PasswordResetTokenRecord & {
  user: StoredUser;
};

export type RateLimitScope =
  | "login"
  | "login_ip"
  | "password_reset"
  | "password_reset_ip";

export type RateLimitRecord = {
  scope: RateLimitScope;
  identifier: string;
  attempts: number;
  windowStartedAt: string;
  blockedUntil: string | null;
  penaltyLevel: number;
  updatedAt: string;
};

export type LocalDatabase = {
  users: StoredUser[];
  documents: FleetDocument[];
  alerts: OperationalAlert[];
};

export type LocalDatabaseSeed = LocalDatabase;

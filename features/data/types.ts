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
  type: string;
  status: DocumentStatus;
  dueDate: string;
};

export type CreateDocumentInput = {
  name: string;
  type: string;
  dueDate: string;
  owner: string;
};

export type UpdateDocumentInput = {
  name: string;
  type: string;
  dueDate: string;
};

export type OperationalAlert = {
  id: string;
  title: string;
  severity: "Alta" | "Media" | "Baixa";
  team: string;
  createdAt: string;
  kind?: "manual" | "document_expiration";
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

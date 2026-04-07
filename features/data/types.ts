export type DocumentStatus = "Em dia" | "A vencer" | "Pendente";

export type FleetDocument = {
  id: string;
  title: string;
  owner: string;
  category: string;
  status: DocumentStatus;
  dueDate: string;
};

export type OperationalAlert = {
  id: string;
  title: string;
  severity: "Alta" | "Media" | "Baixa";
  team: string;
  createdAt: string;
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

export type RateLimitScope = "login" | "password_reset";

export type RateLimitRecord = {
  scope: RateLimitScope;
  identifier: string;
  attempts: number;
  windowStartedAt: string;
  blockedUntil: string | null;
  updatedAt: string;
};

export type LocalDatabase = {
  users: StoredUser[];
  documents: FleetDocument[];
  alerts: OperationalAlert[];
};

export type LocalDatabaseSeed = LocalDatabase;

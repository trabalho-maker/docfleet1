import {
  SqliteDocumentRepository,
  type DocumentRepository,
} from "@/features/data/repositories/document-repository";
import {
  SqliteAlertRepository,
  type AlertRepository,
} from "@/features/data/repositories/alert-repository";
import {
  SqliteUserRepository,
  type UserRepository,
} from "@/features/data/repositories/user-repository";
import {
  SqlitePasswordResetTokenRepository,
  type PasswordResetTokenRepository,
} from "@/features/data/repositories/password-reset-token-repository";
import {
  SqliteAuthRateLimitRepository,
  type AuthRateLimitRepository,
} from "@/features/data/repositories/auth-rate-limit-repository";
import type { DatabaseAdapter, DatabaseProvider } from "@/lib/database/adapter";
import { createDatabaseAdapter, getDatabaseAdapter } from "@/lib/database/provider";

export type DataLayer = {
  users: UserRepository;
  passwordResetTokens: PasswordResetTokenRepository;
  authRateLimits: AuthRateLimitRepository;
  documents: DocumentRepository;
  alerts: AlertRepository;
};

export type DataLayerOptions = {
  adapter?: DatabaseAdapter;
  provider?: DatabaseProvider;
};

function resolveAdapter(options?: DataLayerOptions) {
  if (options?.adapter) {
    return options.adapter;
  }

  if (options?.provider) {
    return createDatabaseAdapter(options.provider);
  }

  return getDatabaseAdapter();
}

export function createDataLayer(options?: DataLayerOptions): DataLayer {
  const adapter = resolveAdapter(options);

  return {
    users: new SqliteUserRepository(adapter),
    passwordResetTokens: new SqlitePasswordResetTokenRepository(adapter),
    authRateLimits: new SqliteAuthRateLimitRepository(adapter),
    documents: new SqliteDocumentRepository(adapter),
    alerts: new SqliteAlertRepository(adapter),
  };
}

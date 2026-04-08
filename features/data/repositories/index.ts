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

export type DataLayer = {
  users: UserRepository;
  passwordResetTokens: PasswordResetTokenRepository;
  authRateLimits: AuthRateLimitRepository;
  documents: DocumentRepository;
  alerts: AlertRepository;
};

export function createDataLayer(): DataLayer {
  return {
    users: new SqliteUserRepository(),
    passwordResetTokens: new SqlitePasswordResetTokenRepository(),
    authRateLimits: new SqliteAuthRateLimitRepository(),
    documents: new SqliteDocumentRepository(),
    alerts: new SqliteAlertRepository(),
  };
}

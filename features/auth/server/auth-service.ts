import bcrypt from "bcryptjs";
import { createDataLayer } from "@/features/data/repositories";
import { logger, maskEmail, maskIp } from "@/lib/logger";
import {
  assertLoginAllowed,
  clearLoginAttempts,
  registerFailedLoginAttempt,
  AuthRateLimitError,
} from "@/features/auth/server/security";

type SignInInput = {
  email: string;
  password: string;
  ipAddress?: string;
};

export async function validateUserCredentials(input: SignInInput) {
  const email = input.email.trim().toLowerCase();

  if (!email || !input.password) {
    logger.warn("auth.validate_credentials.missing_fields", {
      email: maskEmail(email),
      ipAddress: input.ipAddress ? maskIp(input.ipAddress) : undefined,
    });
    return null;
  }

  await assertLoginAllowed(email, input.ipAddress);

  const dataLayer = createDataLayer();
  const user = await dataLayer.users.findByEmail(email);

  if (!user) {
    const rateState = await registerFailedLoginAttempt(email, input.ipAddress);
    logger.warn("auth.validate_credentials.user_not_found", {
      email: maskEmail(email),
      ipAddress: input.ipAddress ? maskIp(input.ipAddress) : undefined,
      attemptsRemaining: rateState.attemptsRemaining,
      retryAfterSeconds: rateState.retryAfterSeconds || undefined,
      penaltyLevel: rateState.penaltyLevel || undefined,
    });
    return null;
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);

  if (!passwordMatches) {
    const rateState = await registerFailedLoginAttempt(email, input.ipAddress);
    logger.warn("auth.validate_credentials.invalid_password", {
      userId: user.id,
      email: maskEmail(user.email),
      ipAddress: input.ipAddress ? maskIp(input.ipAddress) : undefined,
      attemptsRemaining: rateState.attemptsRemaining,
      retryAfterSeconds: rateState.retryAfterSeconds || undefined,
      penaltyLevel: rateState.penaltyLevel || undefined,
    });
    return null;
  }

  await clearLoginAttempts(email, input.ipAddress);

  logger.info("auth.validate_credentials.success", {
    userId: user.id,
    email: maskEmail(user.email),
    ipAddress: input.ipAddress ? maskIp(input.ipAddress) : undefined,
  });

  return user;
}

export { AuthRateLimitError };

import bcrypt from "bcryptjs";
import { createDataLayer } from "@/features/data/repositories";
import { logger, maskEmail } from "@/lib/logger";
import {
  assertLoginAllowed,
  clearLoginAttempts,
  registerFailedLoginAttempt,
  AuthRateLimitError,
} from "@/features/auth/server/security";

type SignInInput = {
  email: string;
  password: string;
};

export async function validateUserCredentials(input: SignInInput) {
  const email = input.email.trim().toLowerCase();

  if (!email || !input.password) {
    logger.warn("auth.validate_credentials.missing_fields", {
      email: maskEmail(email),
    });
    return null;
  }

  await assertLoginAllowed(email);

  const dataLayer = createDataLayer();
  const user = await dataLayer.users.findByEmail(email);

  if (!user) {
    const rateState = await registerFailedLoginAttempt(email);
    logger.warn("auth.validate_credentials.user_not_found", {
      email: maskEmail(email),
      attemptsRemaining: rateState.attemptsRemaining,
      retryAfterSeconds: rateState.retryAfterSeconds || undefined,
    });
    return null;
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);

  if (!passwordMatches) {
    const rateState = await registerFailedLoginAttempt(email);
    logger.warn("auth.validate_credentials.invalid_password", {
      userId: user.id,
      email: maskEmail(user.email),
      attemptsRemaining: rateState.attemptsRemaining,
      retryAfterSeconds: rateState.retryAfterSeconds || undefined,
    });
    return null;
  }

  await clearLoginAttempts(email);

  logger.info("auth.validate_credentials.success", {
    userId: user.id,
    email: maskEmail(user.email),
  });

  return user;
}

export { AuthRateLimitError };

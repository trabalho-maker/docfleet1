import { createDataLayer } from "@/features/data/repositories";

export class AuthRateLimitError extends Error {
  readonly retryAfterSeconds: number;

  constructor(message: string, retryAfterSeconds: number) {
    super(message);
    this.name = "AuthRateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

const loginRateLimitPolicy = {
  windowMs: 15 * 60 * 1000,
  maxAttempts: 5,
  blockDurationMs: 15 * 60 * 1000,
};

const passwordResetRateLimitPolicy = {
  windowMs: 15 * 60 * 1000,
  maxAttempts: 3,
  blockDurationMs: 15 * 60 * 1000,
};

function normalizeIdentifier(value: string) {
  return value.trim().toLowerCase();
}

export async function assertLoginAllowed(identifier: string) {
  const normalizedIdentifier = normalizeIdentifier(identifier);
  const dataLayer = createDataLayer();
  const state = await dataLayer.authRateLimits.getState(
    "login",
    normalizedIdentifier,
    loginRateLimitPolicy,
  );

  if (!state.allowed) {
    throw new AuthRateLimitError(
      "Muitas tentativas de login. Tente novamente mais tarde.",
      state.retryAfterSeconds,
    );
  }
}

export async function registerFailedLoginAttempt(identifier: string) {
  const normalizedIdentifier = normalizeIdentifier(identifier);
  const dataLayer = createDataLayer();
  return dataLayer.authRateLimits.registerFailure(
    "login",
    normalizedIdentifier,
    loginRateLimitPolicy,
  );
}

export async function clearLoginAttempts(identifier: string) {
  const normalizedIdentifier = normalizeIdentifier(identifier);
  const dataLayer = createDataLayer();
  await dataLayer.authRateLimits.clear("login", normalizedIdentifier);
}

export async function consumePasswordResetAttempt(identifier: string) {
  const normalizedIdentifier = normalizeIdentifier(identifier);
  const dataLayer = createDataLayer();
  const state = await dataLayer.authRateLimits.registerAttempt(
    "password_reset",
    normalizedIdentifier,
    passwordResetRateLimitPolicy,
  );

  if (!state.allowed) {
    throw new AuthRateLimitError(
      "Muitas solicitacoes de recuperacao. Tente novamente mais tarde.",
      state.retryAfterSeconds,
    );
  }

  return state;
}

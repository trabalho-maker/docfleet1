import { createDataLayer } from "@/features/data/repositories";
import { logger, maskEmail, maskIp } from "@/lib/logger";

export class AuthRateLimitError extends Error {
  readonly retryAfterSeconds: number;

  constructor(message: string, retryAfterSeconds: number) {
    super(message);
    this.name = "AuthRateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

const loginIdentifierRateLimitPolicy = {
  windowMs: 15 * 60 * 1000,
  maxAttempts: 5,
  baseBlockDurationMs: 15 * 60 * 1000,
  maxBlockDurationMs: 6 * 60 * 60 * 1000,
};

const loginIpRateLimitPolicy = {
  windowMs: 15 * 60 * 1000,
  maxAttempts: 20,
  baseBlockDurationMs: 5 * 60 * 1000,
  maxBlockDurationMs: 2 * 60 * 60 * 1000,
};

const passwordResetIdentifierRateLimitPolicy = {
  windowMs: 15 * 60 * 1000,
  maxAttempts: 3,
  baseBlockDurationMs: 15 * 60 * 1000,
  maxBlockDurationMs: 4 * 60 * 60 * 1000,
};

const passwordResetIpRateLimitPolicy = {
  windowMs: 15 * 60 * 1000,
  maxAttempts: 10,
  baseBlockDurationMs: 10 * 60 * 1000,
  maxBlockDurationMs: 2 * 60 * 60 * 1000,
};

function normalizeIdentifier(value: string) {
  return value.trim().toLowerCase();
}

function normalizeIpAddress(value: string | undefined) {
  const normalizedValue = value?.trim();
  return normalizedValue ? normalizedValue.toLowerCase() : "unknown";
}

function buildCombinedRateLimitState(states: Array<{
  allowed: boolean;
  retryAfterSeconds: number;
  attemptsRemaining: number;
  penaltyLevel: number;
}>) {
  return {
    allowed: states.every((state) => state.allowed),
    retryAfterSeconds: Math.max(...states.map((state) => state.retryAfterSeconds), 0),
    attemptsRemaining: Math.min(...states.map((state) => state.attemptsRemaining)),
    penaltyLevel: Math.max(...states.map((state) => state.penaltyLevel), 0),
  };
}

function logSuspiciousRateLimitEvent(event: string, context: {
  email?: string;
  ipAddress?: string;
  retryAfterSeconds?: number;
  attemptsRemaining?: number;
  penaltyLevel?: number;
}) {
  logger.warn(event, {
    email: context.email ? maskEmail(context.email) : undefined,
    ipAddress: context.ipAddress ? maskIp(context.ipAddress) : undefined,
    retryAfterSeconds: context.retryAfterSeconds,
    attemptsRemaining: context.attemptsRemaining,
    penaltyLevel: context.penaltyLevel,
  });
}

export async function assertLoginAllowed(identifier: string, ipAddress?: string) {
  const normalizedIdentifier = normalizeIdentifier(identifier);
  const normalizedIpAddress = normalizeIpAddress(ipAddress);
  const dataLayer = createDataLayer();
  const [identifierState, ipState] = await Promise.all([
    dataLayer.authRateLimits.getState(
      "login",
      normalizedIdentifier,
      loginIdentifierRateLimitPolicy,
    ),
    dataLayer.authRateLimits.getState(
      "login_ip",
      normalizedIpAddress,
      loginIpRateLimitPolicy,
    ),
  ]);
  const state = buildCombinedRateLimitState([identifierState, ipState]);

  if (!state.allowed) {
    logSuspiciousRateLimitEvent("auth.security.login.blocked", {
      email: normalizedIdentifier,
      ipAddress: normalizedIpAddress,
      retryAfterSeconds: state.retryAfterSeconds,
      penaltyLevel: state.penaltyLevel,
    });
    throw new AuthRateLimitError(
      "Muitas tentativas de login. Tente novamente mais tarde.",
      state.retryAfterSeconds,
    );
  }
}

export async function registerFailedLoginAttempt(identifier: string, ipAddress?: string) {
  const normalizedIdentifier = normalizeIdentifier(identifier);
  const normalizedIpAddress = normalizeIpAddress(ipAddress);
  const dataLayer = createDataLayer();
  const [identifierState, ipState] = await Promise.all([
    dataLayer.authRateLimits.registerFailure(
      "login",
      normalizedIdentifier,
      loginIdentifierRateLimitPolicy,
    ),
    dataLayer.authRateLimits.registerFailure(
      "login_ip",
      normalizedIpAddress,
      loginIpRateLimitPolicy,
    ),
  ]);
  const combinedState = buildCombinedRateLimitState([identifierState, ipState]);

  if (!combinedState.allowed || combinedState.attemptsRemaining <= 1) {
    logSuspiciousRateLimitEvent("auth.security.login.suspicious_attempt", {
      email: normalizedIdentifier,
      ipAddress: normalizedIpAddress,
      retryAfterSeconds: combinedState.retryAfterSeconds,
      attemptsRemaining: combinedState.attemptsRemaining,
      penaltyLevel: combinedState.penaltyLevel,
    });
  }

  return combinedState;
}

export async function clearLoginAttempts(identifier: string, ipAddress?: string) {
  const normalizedIdentifier = normalizeIdentifier(identifier);
  const normalizedIpAddress = normalizeIpAddress(ipAddress);
  const dataLayer = createDataLayer();
  await Promise.all([
    dataLayer.authRateLimits.clear("login", normalizedIdentifier),
    dataLayer.authRateLimits.clear("login_ip", normalizedIpAddress),
  ]);
}

export async function consumePasswordResetAttempt(identifier: string, ipAddress?: string) {
  const normalizedIdentifier = normalizeIdentifier(identifier);
  const normalizedIpAddress = normalizeIpAddress(ipAddress);
  const dataLayer = createDataLayer();
  const [identifierState, ipState] = await Promise.all([
    dataLayer.authRateLimits.registerAttempt(
      "password_reset",
      normalizedIdentifier,
      passwordResetIdentifierRateLimitPolicy,
    ),
    dataLayer.authRateLimits.registerAttempt(
      "password_reset_ip",
      normalizedIpAddress,
      passwordResetIpRateLimitPolicy,
    ),
  ]);
  const state = buildCombinedRateLimitState([identifierState, ipState]);

  if (!state.allowed) {
    logSuspiciousRateLimitEvent("auth.security.password_reset.blocked", {
      email: normalizedIdentifier,
      ipAddress: normalizedIpAddress,
      retryAfterSeconds: state.retryAfterSeconds,
      penaltyLevel: state.penaltyLevel,
    });
    throw new AuthRateLimitError(
      "Muitas solicitações de recuperação. Tente novamente mais tarde.",
      state.retryAfterSeconds,
    );
  }

  if (state.attemptsRemaining <= 1) {
    logSuspiciousRateLimitEvent("auth.security.password_reset.suspicious_attempt", {
      email: normalizedIdentifier,
      ipAddress: normalizedIpAddress,
      attemptsRemaining: state.attemptsRemaining,
      penaltyLevel: state.penaltyLevel,
    });
  }

  return state;
}

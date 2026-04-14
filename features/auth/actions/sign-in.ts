"use server";

import { signIn } from "@/auth";
import { AuthRateLimitError } from "@/features/auth/server/auth-service";
import { logger, maskEmail } from "@/lib/logger";

export type SignInFormState = {
  error?: string;
};

export async function signInAction(
  _previousState: SignInFormState,
  formData: FormData,
): Promise<SignInFormState> {
  const email = formData.get("email")?.toString() ?? "";
  const password = formData.get("password")?.toString() ?? "";

  logger.info("auth.sign_in_action.attempt", {
    email: maskEmail(email),
  });

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });

    logger.info("auth.sign_in_action.success", {
      email: maskEmail(email),
    });

    return {};
  } catch (error) {
    if (error instanceof AuthRateLimitError) {
      logger.warn("auth.sign_in_action.rate_limited", {
        email: maskEmail(email),
        retryAfterSeconds: error.retryAfterSeconds,
      });
      return {
        error: `Muitas tentativas de login. Tente novamente em ${error.retryAfterSeconds}s.`,
      };
    }

    if (
      error instanceof Error &&
      (error.message.includes("CredentialsSignin") ||
        error.message.includes("CallbackRouteError"))
    ) {
      logger.warn("auth.sign_in_action.invalid_credentials", {
        email: maskEmail(email),
      });
      return {
        error: "Email ou senha inválidos.",
      };
    }

    logger.error("auth.sign_in_action.error", {
      email: maskEmail(email),
      error,
    });
    throw error;
  }
}

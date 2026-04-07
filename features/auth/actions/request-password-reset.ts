"use server";

import { createDataLayer } from "@/features/data/repositories";
import { EmailDeliveryError } from "@/lib/email/mailer";
import { logger, maskEmail } from "@/lib/logger";
import { validateEmailInput } from "@/features/auth/server/validation";
import { sendPasswordResetEmail } from "@/features/auth/server/password-reset-email";
import {
  AuthRateLimitError,
  consumePasswordResetAttempt,
} from "@/features/auth/server/security";

export type RequestPasswordResetState = {
  error?: string;
  success?: string;
  resetUrl?: string;
};

export async function requestPasswordResetAction(
  _previousState: RequestPasswordResetState,
  formData: FormData,
): Promise<RequestPasswordResetState> {
  const email = formData.get("email")?.toString() ?? "";
  const normalizedEmail = email.trim().toLowerCase();
  let createdTokenId: string | null = null;

  logger.info("auth.password_reset.request.attempt", {
    email: maskEmail(normalizedEmail),
  });

  if (!validateEmailInput(normalizedEmail)) {
    return {
      error: "Informe um email valido.",
    };
  }

  try {
    await consumePasswordResetAttempt(normalizedEmail);

    const dataLayer = createDataLayer();
    const user = await dataLayer.users.findByEmail(normalizedEmail);

    if (!user) {
      logger.warn("auth.password_reset.request.user_not_found", {
        email: maskEmail(normalizedEmail),
      });

      return {
        success:
          "Se existir uma conta com esse email, enviaremos as instrucoes de recuperacao.",
      };
    }

    const token = await dataLayer.passwordResetTokens.createForUser(user);
    createdTokenId = token.id;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
    const resetUrl = `${baseUrl}/redefinir-senha?token=${token.token}`;
    const delivery = await sendPasswordResetEmail({
      user,
      resetUrl,
      expiresAt: token.expiresAt,
    });

    logger.warn("auth.password_reset.request.created", {
      userId: user.id,
      email: maskEmail(user.email),
      expiresAt: token.expiresAt,
      delivery: delivery.transport,
      resetUrl:
        process.env.NODE_ENV === "development" && delivery.transport === "file"
          ? resetUrl
          : undefined,
    });

    return {
      success:
        "Se existir uma conta com esse email, enviaremos as instrucoes de recuperacao.",
      resetUrl:
        process.env.NODE_ENV === "development" && delivery.transport === "file"
          ? resetUrl
          : undefined,
    };
  } catch (error) {
    if (error instanceof AuthRateLimitError) {
      logger.warn("auth.password_reset.request.rate_limited", {
        email: maskEmail(normalizedEmail),
        retryAfterSeconds: error.retryAfterSeconds,
      });

      return {
        error: `Muitas solicitacoes de recuperacao. Tente novamente em ${error.retryAfterSeconds}s.`,
      };
    }

    if (error instanceof EmailDeliveryError) {
      if (createdTokenId) {
        const dataLayer = createDataLayer();
        await dataLayer.passwordResetTokens.deleteById(createdTokenId);
      }

      logger.error("auth.password_reset.request.delivery_failed", {
        email: maskEmail(normalizedEmail),
        error,
      });
      return {
        error:
          "Nao foi possivel enviar o email de recuperacao agora. Tente novamente em instantes.",
      };
    }

    logger.error("auth.password_reset.request.error", {
      email: maskEmail(normalizedEmail),
      error,
    });
    throw error;
  }
}

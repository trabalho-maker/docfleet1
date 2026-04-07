"use server";

import { redirect } from "next/navigation";
import { createDataLayer } from "@/features/data/repositories";
import { logger, maskEmail } from "@/lib/logger";
import { validatePasswordResetInput } from "@/features/auth/server/validation";

export type ResetPasswordState = {
  error?: string;
  success?: string;
  fieldErrors?: {
    password?: string;
    confirmPassword?: string;
  };
};

export async function resetPasswordAction(
  _previousState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const token = formData.get("token")?.toString() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const confirmPassword = formData.get("confirmPassword")?.toString() ?? "";

  const fieldErrors = validatePasswordResetInput(password, confirmPassword);

  if (Object.keys(fieldErrors).length > 0) {
    return {
      fieldErrors,
    };
  }

  const dataLayer = createDataLayer();
  const resetToken = await dataLayer.passwordResetTokens.findValidByRawToken(token);

  if (!resetToken) {
    logger.warn("auth.password_reset.consume.invalid_token");
    return {
      error: "Token invalido ou expirado. Solicite uma nova recuperacao.",
    };
  }

  await dataLayer.users.updatePassword(resetToken.user.id, password);
  await dataLayer.passwordResetTokens.consume(resetToken.id);
  await dataLayer.passwordResetTokens.deleteActiveForUser(resetToken.user.id);

  logger.warn("auth.password_reset.consume.success", {
    userId: resetToken.user.id,
    email: maskEmail(resetToken.user.email),
  });

  redirect("/login?reset=success");
}

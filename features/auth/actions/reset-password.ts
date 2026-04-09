"use server";

import { redirect } from "next/navigation";
import { logger, maskEmail } from "@/lib/logger";
import { resetPasswordWithToken } from "@/features/auth/server/password-reset-service";
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

  const result = await resetPasswordWithToken(token, password);

  if (!result.success) {
    logger.warn("auth.password_reset.consume.invalid_token");
    return {
      error: "Token invalido ou expirado. Solicite uma nova recuperacao.",
    };
  }

  logger.warn("auth.password_reset.consume.success", {
    userId: result.user.id,
    email: maskEmail(result.user.email),
  });

  redirect("/login?reset=success");
}

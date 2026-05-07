"use server";

import { auth } from "@/auth";
import { canManageOperationalData } from "@/features/auth/lib/role-authorization";
import { createDataLayer } from "@/features/data/repositories";
import { validateSignUpInput } from "@/features/auth/server/validation";
import { logger, maskEmail } from "@/lib/logger";

export type SignUpFormState = {
  fieldErrors?: {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  };
  formError?: string;
  successMessage?: string;
};

export async function signUpAction(
  _previousState: SignUpFormState,
  formData: FormData,
): Promise<SignUpFormState> {
  const session = await auth();
  const rawEmail = formData.get("email")?.toString() ?? "";
  const validation = validateSignUpInput({
    name: formData.get("name")?.toString() ?? "",
    email: rawEmail,
    password: formData.get("password")?.toString() ?? "",
    confirmPassword: formData.get("confirmPassword")?.toString() ?? "",
  });

  logger.info("auth.sign_up_action.attempt", {
    email: maskEmail(rawEmail),
  });

  if (!session?.user?.id || !canManageOperationalData(session.user)) {
    logger.warn("auth.sign_up_action.forbidden", {
      email: maskEmail(rawEmail),
      userId: session?.user?.id ?? null,
      role: session?.user?.role ?? null,
    });
    return {
      formError: "Apenas gestores autenticados podem criar novos usuários.",
    };
  }

  if (!validation.success) {
    logger.warn("auth.sign_up_action.validation_failed", {
      email: maskEmail(rawEmail),
      fields: Object.keys(validation.errors),
    });
    return {
      fieldErrors: validation.errors,
    };
  }

  try {
    const dataLayer = createDataLayer();

    await dataLayer.users.create({
      name: validation.data.name,
      email: validation.data.email,
      password: validation.data.password,
    });

    logger.info("auth.sign_up_action.user_created", {
      email: maskEmail(validation.data.email),
      createdByUserId: session.user.id,
    });

    logger.info("auth.sign_up_action.success", {
      email: maskEmail(validation.data.email),
      createdByUserId: session.user.id,
    });

    return {
      successMessage: "Usuário criado com sucesso e pronto para acessar o DocFleet.",
    };
  } catch (error) {
    if (error instanceof Error && error.message === "USER_ALREADY_EXISTS") {
      logger.warn("auth.sign_up_action.duplicate_email", {
        email: maskEmail(validation.data.email),
      });
      return {
        fieldErrors: {
          email: "Já existe um usuário cadastrado com este email.",
        },
      };
    }

    logger.error("auth.sign_up_action.error", {
      email: maskEmail(validation.success ? validation.data.email : rawEmail),
      error,
    });
    throw error;
  }
}

"use server";

import { logger, maskCpf } from "@/lib/logger";
import {
  AssociateConflictError,
  AssociateValidationError,
  createAssociateService,
} from "@/features/associates/server/associate.service";
import {
  AssociateAccessDeniedError,
  requireAssociateModuleAccess,
} from "@/features/associates/server/access";
import { validateCreateAssociateInput } from "@/features/associates/lib/associate.validators";
import type {
  AssociateFieldErrors,
  AssociateFormValues,
} from "@/features/associates/types";

export type CreateAssociateActionResult =
  | {
      success: true;
    }
  | {
      success: false;
      fieldErrors?: AssociateFieldErrors;
      formError?: string;
    };

export async function createAssociateAction(
  input: AssociateFormValues,
): Promise<CreateAssociateActionResult> {
  let user;

  try {
    user = await requireAssociateModuleAccess("create");
  } catch (error) {
    if (error instanceof AssociateAccessDeniedError) {
      return {
        success: false,
        formError: error.message,
      };
    }

    throw error;
  }

  const validation = validateCreateAssociateInput(input);

  if (!validation.success) {
    return {
      success: false,
      fieldErrors: validation.errors,
    };
  }

  try {
    const associateService = createAssociateService();
    await associateService.createAssociate(validation.data);

    logger.info("associates.create.success", {
      userId: user.id,
      cpf: maskCpf(validation.data.cpf),
      registrationNumber: validation.data.registrationNumber,
      category: validation.data.category,
      status: validation.data.status,
    });

    return {
      success: true,
    };
  } catch (error) {
    if (
      error instanceof AssociateConflictError &&
      error.message === "ASSOCIATE_CPF_ALREADY_EXISTS"
    ) {
      logger.warn("associates.create.duplicate_cpf", {
        userId: user.id,
        cpf: maskCpf(validation.data.cpf),
      });

      return {
        success: false,
        fieldErrors: {
          cpf: "Já existe um associado cadastrado com este CPF.",
        },
      };
    }

    if (
      error instanceof AssociateConflictError &&
      error.message === "ASSOCIATE_REGISTRATION_NUMBER_ALREADY_EXISTS"
    ) {
      logger.warn("associates.create.duplicate_registration_number", {
        userId: user.id,
        registrationNumber: validation.data.registrationNumber,
      });

      return {
        success: false,
        fieldErrors: {
          registrationNumber:
            "Já existe um associado cadastrado com esta matrícula.",
        },
      };
    }

    if (error instanceof AssociateValidationError) {
      return {
        success: false,
        formError: error.message,
      };
    }

    logger.error("associates.create.error", {
      userId: user.id,
      cpf: maskCpf(validation.data.cpf),
      error,
    });

    return {
      success: false,
      formError:
        "Não foi possível cadastrar o associado agora. Tente novamente em instantes.",
    };
  }
}

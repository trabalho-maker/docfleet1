"use server";

import { logger, maskCpf } from "@/lib/logger";
import {
  AssociateConflictError,
  AssociateNotFoundError,
  AssociateValidationError,
  createAssociateService,
} from "@/features/associates/server/associate.service";
import {
  AssociateAccessDeniedError,
  requireAssociateModuleAccess,
} from "@/features/associates/server/access";
import { validateUpdateAssociateInput } from "@/features/associates/lib/associate.validators";
import type {
  AssociateFieldErrors,
  AssociateFormValues,
} from "@/features/associates/types";

export type UpdateAssociateActionResult =
  | {
      success: true;
      associateId: string;
    }
  | {
      success: false;
      fieldErrors?: AssociateFieldErrors;
      formError?: string;
      notFound?: boolean;
    };

export async function updateAssociateAction(
  id: string,
  input: AssociateFormValues,
): Promise<UpdateAssociateActionResult> {
  let user;

  try {
    user = await requireAssociateModuleAccess("edit");
  } catch (error) {
    if (error instanceof AssociateAccessDeniedError) {
      return {
        success: false,
        formError: error.message,
      };
    }

    throw error;
  }

  const normalizedInput: AssociateFormValues = {
    ...input,
    category: "Titular",
  };

  const validation = validateUpdateAssociateInput(normalizedInput);

  if (!validation.success) {
    return {
      success: false,
      fieldErrors: validation.errors,
    };
  }

  try {
    const associateService = createAssociateService();
    const updatedAssociate = await associateService.updateAssociate(id, validation.data);

    logger.info("associates.update.success", {
      userId: user.id,
      associateId: id,
      cpf: validation.data.cpf ? maskCpf(validation.data.cpf) : undefined,
      registrationNumber: validation.data.registrationNumber,
    });

    return {
      success: true,
      associateId: updatedAssociate.id,
    };
  } catch (error) {
    if (
      error instanceof AssociateConflictError &&
      error.message === "ASSOCIATE_CPF_ALREADY_EXISTS"
    ) {
      logger.warn("associates.update.duplicate_cpf", {
        userId: user.id,
        associateId: id,
        cpf: validation.data.cpf ? maskCpf(validation.data.cpf) : undefined,
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
      logger.warn("associates.update.duplicate_registration_number", {
        userId: user.id,
        associateId: id,
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

    if (
      error instanceof AssociateConflictError &&
      error.message === "ASSOCIATE_RG_ALREADY_EXISTS"
    ) {
      logger.warn("associates.update.duplicate_rg", {
        userId: user.id,
        associateId: id,
        rg: validation.data.rg,
      });

      return {
        success: false,
        fieldErrors: {
          rg: "Já existe um associado cadastrado com este RG.",
        },
      };
    }

    if (
      error instanceof AssociateConflictError &&
      error.message === "ASSOCIATE_CNH_ALREADY_EXISTS"
    ) {
      logger.warn("associates.update.duplicate_cnh", {
        userId: user.id,
        associateId: id,
        cnh: validation.data.cnh,
      });

      return {
        success: false,
        fieldErrors: {
          cnh: "Já existe um associado cadastrado com esta CNH.",
        },
      };
    }

    if (
      error instanceof AssociateConflictError &&
      error.message === "ASSOCIATE_COMPANY_CNPJ_ALREADY_EXISTS"
    ) {
      logger.warn("associates.update.duplicate_company_cnpj", {
        userId: user.id,
        associateId: id,
        cnpjEmpresa: validation.data.cnpjEmpresa,
      });

      return {
        success: false,
        fieldErrors: {
          cnpjEmpresa: "Já existe um associado cadastrado com este CNPJ.",
        },
      };
    }

    if (error instanceof AssociateNotFoundError) {
      logger.warn("associates.update.not_found", {
        userId: user.id,
        associateId: id,
      });

      return {
        success: false,
        notFound: true,
        formError: "O associado informado não foi encontrado.",
      };
    }

    if (error instanceof AssociateValidationError) {
      return {
        success: false,
        formError: error.message,
      };
    }

    logger.error("associates.update.error", {
      userId: user.id,
      associateId: id,
      error,
    });

    return {
      success: false,
      formError:
        "Não foi possível atualizar o associado agora. Tente novamente em instantes.",
    };
  }
}

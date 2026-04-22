"use server";

import { logger, maskCpf } from "@/lib/logger";
import {
  AssociateAccessDeniedError,
  requireAssociateModuleAccess,
} from "@/features/associates/server/access";
import {
  AssociateConflictError,
  AssociateNotFoundError,
  AssociateValidationError,
} from "@/features/associates/server/associate.service";
import { createTaxistaCadastroService } from "@/features/taxistas/cadastro/server/taxista-cadastro.service";
import type {
  TaxistaCadastroFieldErrors,
  TaxistaCadastroFormValues,
} from "@/features/taxistas/cadastro/types";

export type UpdateTaxistaCadastroActionResult =
  | {
      success: true;
      associateId: string;
    }
  | {
      success: false;
      fieldErrors?: TaxistaCadastroFieldErrors;
      formError?: string;
      notFound?: boolean;
    };

export async function updateTaxistaCadastroAction(
  associateId: string,
  input: TaxistaCadastroFormValues,
): Promise<UpdateTaxistaCadastroActionResult> {
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

  try {
    const service = createTaxistaCadastroService();
    const result = await service.updateTaxistaCadastro(associateId, input);

    if (!result.success) {
      return {
        success: false,
        fieldErrors: result.fieldErrors,
      };
    }

    logger.info("taxistas.cadastro.update.success", {
      userId: user.id,
      associateId,
      cpf: maskCpf(result.data.cpf),
      placa: result.data.placa ?? undefined,
    });

    return {
      success: true,
      associateId,
    };
  } catch (error) {
    if (
      error instanceof AssociateConflictError &&
      error.message === "ASSOCIATE_CPF_ALREADY_EXISTS"
    ) {
      return {
        success: false,
        fieldErrors: {
          cpf: "Ja existe um associado cadastrado com este CPF.",
        },
      };
    }

    if (error instanceof AssociateNotFoundError) {
      return {
        success: false,
        notFound: true,
        formError: "O taxista informado nao foi encontrado.",
      };
    }

    if (error instanceof AssociateValidationError) {
      return {
        success: false,
        formError: error.message,
      };
    }

    logger.error("taxistas.cadastro.update.error", {
      userId: user.id,
      associateId,
      error,
    });

    return {
      success: false,
      formError:
        "Nao foi possivel salvar o cadastro do taxista agora. Tente novamente em instantes.",
    };
  }
}

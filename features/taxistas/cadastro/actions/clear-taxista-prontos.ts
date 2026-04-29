"use server";

import { logger } from "@/lib/logger";
import {
  AssociateAccessDeniedError,
  requireAssociateModuleAccess,
} from "@/features/associates/server/access";
import { createTaxistaCadastroService } from "@/features/taxistas/cadastro/server/taxista-cadastro.service";

export type ClearTaxistaProntosActionResult =
  | {
      success: true;
    }
  | {
      success: false;
      formError: string;
    };

export async function clearTaxistaProntosAction(): Promise<ClearTaxistaProntosActionResult> {
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
    await createTaxistaCadastroService().clearReadyTaxistas();

    logger.info("taxistas.cadastro.alvara.clear-prontos.success", {
      userId: user.id,
    });

    return {
      success: true,
    };
  } catch (error) {
    logger.error("taxistas.cadastro.alvara.clear-prontos.error", {
      userId: user.id,
      error,
    });

    return {
      success: false,
      formError: "Não foi possível limpar os alvarás prontos agora. Tente novamente em instantes.",
    };
  }
}

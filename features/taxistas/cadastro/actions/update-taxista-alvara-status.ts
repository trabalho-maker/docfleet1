"use server";

import { logger } from "@/lib/logger";
import {
  AssociateAccessDeniedError,
  requireAssociateModuleAccess,
} from "@/features/associates/server/access";
import { createTaxistaCadastroService } from "@/features/taxistas/cadastro/server/taxista-cadastro.service";
import type { TaxistaAlvaraStatus } from "@/features/taxistas/cadastro/types";

export type UpdateTaxistaAlvaraStatusActionResult =
  | {
      success: true;
      associateId: string;
      statusAlvara: TaxistaAlvaraStatus;
    }
  | {
      success: false;
      formError: string;
    };

export async function updateTaxistaAlvaraStatusAction(
  associateId: string,
  statusAlvara: TaxistaAlvaraStatus,
): Promise<UpdateTaxistaAlvaraStatusActionResult> {
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
    await createTaxistaCadastroService().updateTaxistaAlvaraStatus(
      associateId,
      statusAlvara,
    );

    logger.info("taxistas.cadastro.alvara.update.success", {
      userId: user.id,
      associateId,
      statusAlvara,
    });

    return {
      success: true,
      associateId,
      statusAlvara,
    };
  } catch (error) {
    const formError =
      error instanceof Error &&
      error.message === "TAXISTA_PRONTO_REQUIRES_PROTOCOLADO"
        ? "Somente taxistas protocolados podem ser movidos para pronto."
        : error instanceof Error && error.message === "TAXISTA_NOT_FOUND"
          ? "O taxista informado não foi encontrado."
          : "Não foi possível atualizar o status do alvará agora. Tente novamente em instantes.";

    logger.error("taxistas.cadastro.alvara.update.error", {
      userId: user.id,
      associateId,
      statusAlvara,
      error,
    });

    return {
      success: false,
      formError,
    };
  }
}

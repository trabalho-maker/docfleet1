"use server";

import { logger } from "@/lib/logger";
import {
  AssociateNotFoundError,
  createAssociateService,
} from "@/src/features/associates/server/associate.service";
import { requireAssociateModuleAccess } from "@/src/features/associates/server/access";

export type DeleteAssociateActionResult =
  | {
      success: true;
    }
  | {
      success: false;
      formError: string;
      notFound?: boolean;
    };

export async function deleteAssociateAction(
  associateId: string,
): Promise<DeleteAssociateActionResult> {
  const user = await requireAssociateModuleAccess();

  try {
    const associateService = createAssociateService();
    await associateService.deleteAssociate(associateId);

    logger.info("associates.delete.success", {
      userId: user.id,
      associateId,
    });

    return {
      success: true,
    };
  } catch (error) {
    if (error instanceof AssociateNotFoundError) {
      logger.warn("associates.delete.not_found", {
        userId: user.id,
        associateId,
      });

      return {
        success: false,
        notFound: true,
        formError: "O associado informado não foi encontrado.",
      };
    }

    logger.error("associates.delete.error", {
      userId: user.id,
      associateId,
      error,
    });

    return {
      success: false,
      formError:
        "Não foi possível excluir o associado agora. Tente novamente em instantes.",
    };
  }
}

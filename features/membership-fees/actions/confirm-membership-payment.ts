"use server";

import {
  AssociateAccessDeniedError,
  requireAssociateModuleAccess,
} from "@/features/associates/server/access";
import {
  createMembershipFeeService,
  MembershipFeeConflictError,
  MembershipFeeNotFoundError,
  MembershipFeeValidationError,
} from "@/features/membership-fees/server/membership-fee.service";

export type ConfirmMembershipPaymentActionResult =
  | {
      success: true;
      paidAt: string;
    }
  | {
      success: false;
      formError: string;
      duplicate?: boolean;
      notFound?: boolean;
    };

export async function confirmMembershipPaymentAction(input: {
  associateId: string;
  competenceYear: number;
  competenceMonth: number;
}): Promise<ConfirmMembershipPaymentActionResult> {
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
    const payment = await createMembershipFeeService().confirmMembershipPayment({
      associateId: input.associateId,
      competenceYear: input.competenceYear,
      competenceMonth: input.competenceMonth,
      paidByUserId: user.id,
    });

    return {
      success: true,
      paidAt: payment.paidAt,
    };
  } catch (error) {
    if (error instanceof MembershipFeeConflictError) {
      return {
        success: false,
        duplicate: true,
        formError: "Esta competencia ja foi registrada como paga.",
      };
    }

    if (error instanceof MembershipFeeValidationError) {
      return {
        success: false,
        formError: "Nao foi possivel confirmar o pagamento com os dados recebidos.",
      };
    }

    if (error instanceof MembershipFeeNotFoundError) {
      return {
        success: false,
        notFound: true,
        formError: "Nao foi possivel localizar a ficha de mensalidades deste associado.",
      };
    }

    throw error;
  }
}


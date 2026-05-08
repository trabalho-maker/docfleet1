"use server";

import {
  AssociateAccessDeniedError,
  requireAssociateModuleAccess,
} from "@/features/associates/server/access";
import {
  createMembershipFeeService,
  MembershipFeeNotFoundError,
  MembershipFeeValidationError,
} from "@/features/membership-fees/server/membership-fee.service";

export type ReverseMembershipPaymentActionResult =
  | {
      success: true;
      competenceLabel: string;
    }
  | {
      success: false;
      formError: string;
      notFound?: boolean;
    };

export async function reverseMembershipPaymentAction(input: {
  associateId: string;
  competenceYear: number;
  competenceMonth: number;
}): Promise<ReverseMembershipPaymentActionResult> {
  try {
    await requireAssociateModuleAccess("edit");
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
    const payment = await createMembershipFeeService().reverseMembershipPayment({
      associateId: input.associateId,
      competenceYear: input.competenceYear,
      competenceMonth: input.competenceMonth,
    });

    return {
      success: true,
      competenceLabel: `${String(payment.competenceMonth).padStart(2, "0")}/${payment.competenceYear}`,
    };
  } catch (error) {
    if (error instanceof MembershipFeeValidationError) {
      return {
        success: false,
        formError: "Não foi possível estornar o pagamento com os dados recebidos.",
      };
    }

    if (error instanceof MembershipFeeNotFoundError) {
      return {
        success: false,
        notFound: true,
        formError:
          error.message === "MEMBERSHIP_FEE_PAYMENT_NOT_FOUND"
            ? "Não existe pagamento registrado para esta competência."
            : "Não foi possível localizar a ficha de mensalidades deste associado.",
      };
    }

    throw error;
  }
}

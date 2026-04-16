"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AssociateForm } from "@/features/associates/components/associate-form";
import { AssociatesPageHeader } from "@/features/associates/components/associates-page-header";
import { updateAssociateAction } from "@/features/associates/actions/update-associate";
import type {
  AssociateFieldErrors,
  AssociateFormValues,
} from "@/features/associates/types";

type EditAssociateSectionProps = {
  associateId: string;
  initialValues: Partial<AssociateFormValues>;
  userName: string;
  userEmail: string;
  userRole: string;
};

export function EditAssociateSection({
  associateId,
  initialValues,
  userName,
  userEmail,
  userRole,
}: EditAssociateSectionProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<AssociateFieldErrors>({});
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleSubmit(
    values: AssociateFormValues,
    intent: "save" | "saveAndPrint",
  ) {
    setIsSubmitting(true);
    setServerErrors({});
    setMessage(null);

    try {
      const result = await updateAssociateAction(associateId, values);

      if (!result.success) {
        setServerErrors(result.fieldErrors ?? {});

        if (result.notFound) {
          router.replace("/associados");
          return;
        }

        setMessage(
          result.formError
            ? {
                type: "error",
                text: result.formError,
              }
            : null,
        );
        return;
      }

      const targetUrl =
        intent === "saveAndPrint"
          ? `/associados/${result.associateId}/impressao?autoPrint=1`
          : "/associados?success=updated";

      router.push(targetUrl);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <AssociatesPageHeader
        eyebrow="Edição de associados"
        title="Editar associado"
        description="Atualize os dados cadastrais do associado mantendo a consistência da base, da ficha institucional e das validações do domínio."
        userName={userName}
        userEmail={userEmail}
        userRole={userRole}
        action={
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/associados/${associateId}/impressao`}
              className="df-button-secondary"
            >
              Ver ficha
            </Link>
            <Link href="/associados" className="df-button-secondary">
              Voltar para associados
            </Link>
          </div>
        }
      />

      <AssociateForm
        initialValues={initialValues}
        mode="edit"
        submitLabel="Salvar alterações"
        saveAndPrintLabel="Salvar e imprimir"
        isSubmitting={isSubmitting}
        serverErrors={serverErrors}
        message={message}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/associados")}
      />
    </div>
  );
}

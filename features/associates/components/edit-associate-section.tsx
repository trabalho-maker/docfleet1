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
  initialValues: AssociateFormValues;
  userName: string;
  userEmail: string;
};

export function EditAssociateSection({
  associateId,
  initialValues,
  userName,
  userEmail,
}: EditAssociateSectionProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<AssociateFieldErrors>({});
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleSubmit(values: AssociateFormValues) {
    setIsSubmitting(true);
    setServerErrors({});
    setMessage(null);

    try {
      const result = await updateAssociateAction(associateId, values);

      if (!result.success) {
        setServerErrors(result.fieldErrors ?? {});

        if (result.notFound) {
          router.replace("/associados");
          router.refresh();
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

      router.push("/associados?success=updated");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <AssociatesPageHeader
        eyebrow="EdiÃ§Ã£o de associados"
        title="Editar associado"
        description="Atualize os dados cadastrais do associado mantendo a consistÃªncia da base e as validaÃ§Ãµes do domÃ­nio."
        userName={userName}
        userEmail={userEmail}
        action={
          <Link
            href="/associados"
            className="inline-flex h-10 items-center justify-center rounded-full border border-[#E5E7EB] bg-white px-4 text-sm font-semibold text-[#0F172A] transition-colors hover:bg-[#FFF7ED]"
          >
            Voltar para associados
          </Link>
        }
      />

      <AssociateForm
        initialValues={initialValues}
        mode="edit"
        submitLabel="Salvar alteraÃ§Ãµes"
        isSubmitting={isSubmitting}
        serverErrors={serverErrors}
        message={message}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/associados")}
      />
    </div>
  );
}


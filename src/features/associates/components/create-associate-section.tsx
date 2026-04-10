"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AssociateForm } from "@/src/features/associates/components/associate-form";
import { AssociatesPageHeader } from "@/src/features/associates/components/associates-page-header";
import { createAssociateAction } from "@/src/features/associates/actions/create-associate";
import type {
  AssociateFieldErrors,
  AssociateFormValues,
} from "@/src/features/associates/types";

type CreateAssociateSectionProps = {
  userName: string;
  userEmail: string;
};

export function CreateAssociateSection({
  userName,
  userEmail,
}: CreateAssociateSectionProps) {
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
      const result = await createAssociateAction(values);

      if (!result.success) {
        setServerErrors(result.fieldErrors ?? {});
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

      router.push("/associados?success=created");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <AssociatesPageHeader
        eyebrow="Cadastro de associados"
        title="Novo associado"
        description="Cadastre um novo associado na base do sistema com dados validados, tipagem forte e integração direta com a camada de serviço."
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
        mode="create"
        submitLabel="Criar associado"
        isSubmitting={isSubmitting}
        serverErrors={serverErrors}
        message={message}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/associados")}
      />
    </div>
  );
}

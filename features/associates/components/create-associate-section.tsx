"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createAssociateAction } from "@/features/associates/actions/create-associate";
import { AssociateForm } from "@/features/associates/components/associate-form";
import { AssociatesPageHeader } from "@/features/associates/components/associates-page-header";
import type {
  AssociateFieldErrors,
  AssociateFormValues,
} from "@/features/associates/types";

type CreateAssociateSectionProps = {
  userName: string;
  userEmail: string;
  userRole: string;
};

export function CreateAssociateSection({
  userName,
  userEmail,
  userRole,
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
        userRole={userRole}
        action={
          <Link href="/associados" className="df-button-secondary">
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

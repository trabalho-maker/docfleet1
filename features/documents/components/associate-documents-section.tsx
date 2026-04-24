"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AssociatesPageHeader } from "@/features/associates/components/associates-page-header";
import {
  associateDocumentTypes,
  getDocumentTypeLabel,
} from "@/features/documents/constants";
import { saveAssociateDocumentsAction } from "@/features/documents/actions/save-associate-documents";
import type {
  AssociateDocumentFieldErrors,
  AssociateDocumentFormValues,
} from "@/features/documents/types";

type AssociateDocumentsSectionProps = {
  associateId: string;
  associateName: string;
  associateRegistrationNumber: string;
  associateCategoryLabel: string;
  initialValues: AssociateDocumentFormValues;
  userName: string;
  userEmail: string;
  userRole: string;
};

export function AssociateDocumentsSection({
  associateId,
  associateName,
  associateRegistrationNumber,
  associateCategoryLabel,
  initialValues,
  userName,
  userEmail,
  userRole,
}: AssociateDocumentsSectionProps) {
  const router = useRouter();
  const [values, setValues] = useState<AssociateDocumentFormValues>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<AssociateDocumentFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  function updateField(
    field: keyof AssociateDocumentFormValues,
    value: string,
  ) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
    setFieldErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});
    setMessage(null);

    try {
      const result = await saveAssociateDocumentsAction(associateId, values);

      if (!result.success) {
        setFieldErrors(result.fieldErrors ?? {});
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

      setMessage({
        type: "success",
        text: "Documentos atualizados com sucesso.",
      });
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <AssociatesPageHeader
        eyebrow="Cadastro complementar"
        title="Documentos com vencimento"
        description="Registre vencimentos documentais do associado sem misturar essa etapa com a ficha principal."
        userName={userName}
        userEmail={userEmail}
        userRole={userRole}
        action={
          <div className="flex flex-wrap gap-3">
            <Link href={`/associados/${associateId}/editar`} className="df-button-secondary">
              Voltar para edicao
            </Link>
            <Link href="/associados" className="df-button-secondary">
              Base de associados
            </Link>
          </div>
        }
      />

      <article className="df-section-card p-6 lg:p-7">
        <div className="flex flex-col gap-3 border-b border-[var(--color-border)] pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="df-eyebrow">Associado vinculado</p>
            <h2 className="mt-2 text-[1.8rem] font-semibold tracking-tight text-[var(--color-foreground)]">
              {associateName}
            </h2>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              {associateRegistrationNumber} - {associateCategoryLabel}
            </p>
          </div>
          <span className="df-badge-pill bg-[#EEF4FB] text-[#35577E]">
            Etapa documental
          </span>
        </div>

        {message ? (
          <div
            role="alert"
            className={`mt-6 rounded-2xl px-4 py-3 text-sm ${
              message.type === "success"
                ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {message.text}
          </div>
        ) : null}

        <form className="mt-6 grid gap-6" onSubmit={(event) => void handleSubmit(event)} noValidate>
          <section className="grid gap-5 rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 lg:grid-cols-2">
            {associateDocumentTypes.map((documentType) => (
              <Input
                key={documentType}
                id={`associate-document-${documentType.toLowerCase()}`}
                label={getDocumentTypeLabel(documentType)}
                type="date"
                value={values[documentType]}
                onChange={(event) => updateField(documentType, event.target.value)}
                error={fieldErrors[documentType]}
              />
            ))}
          </section>

          <div className="flex flex-col gap-3 border-t border-[var(--color-border)] pt-5 sm:flex-row">
            <Button
              type="submit"
              isLoading={isSubmitting}
              loadingLabel="Salvando..."
              className="sm:flex-1"
            >
              Salvar documentos
            </Button>
            <button
              type="button"
              onClick={() => router.push(`/associados/${associateId}/editar`)}
              className="df-button-secondary"
            >
              Cancelar
            </button>
          </div>
        </form>
      </article>
    </div>
  );
}

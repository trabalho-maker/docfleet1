"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AssociateForm } from "@/src/features/associates/components/associate-form";
import { updateAssociateAction } from "@/src/features/associates/actions/update-associate";
import type {
  AssociateFieldErrors,
  AssociateFormValues,
} from "@/src/features/associates/types";

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
    <div className="flex w-full flex-col gap-8">
      <section className="rounded-[32px] border border-[var(--color-border)] bg-[var(--color-card)] p-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
              Edicao de associados
            </p>
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-[var(--color-foreground)]">
                Editar associado
              </h1>
              <p className="mt-2 max-w-3xl text-base leading-7 text-[var(--color-muted)]">
                Atualize os dados cadastrais do associado mantendo a consistencia da
                base e as validacoes do dominio.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-white/80 px-5 py-4 text-sm text-[var(--color-muted)]">
            <p className="font-semibold text-[var(--color-foreground)]">{userName}</p>
            <p>{userEmail}</p>
            <Link
              href="/associados"
              className="inline-flex h-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-white px-4 text-sm font-semibold text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-surface-strong)]"
            >
              Voltar para associados
            </Link>
          </div>
        </div>
      </section>

      <AssociateForm
        initialValues={initialValues}
        mode="edit"
        submitLabel="Salvar alteracoes"
        isSubmitting={isSubmitting}
        serverErrors={serverErrors}
        message={message}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/associados")}
      />
    </div>
  );
}

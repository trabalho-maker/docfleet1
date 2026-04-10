"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteAssociateAction } from "@/src/features/associates/actions/delete-associate";
import { AssociatesTable } from "@/src/features/associates/components/associates-table";
import { EmptyState } from "@/src/features/associates/components/empty-state";
import { FeedbackAlert } from "@/src/features/associates/components/feedback-alert";
import type { Associate } from "@/src/features/associates/types";

type AssociatesListSectionProps = {
  initialAssociates: Associate[];
  hasActiveFilters: boolean;
  initialFeedback?: {
    type: "success" | "error";
    message: string;
  } | null;
};

export function AssociatesListSection({
  initialAssociates,
  hasActiveFilters,
  initialFeedback = null,
}: AssociatesListSectionProps) {
  const router = useRouter();
  const [associates, setAssociates] = useState(initialAssociates);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(initialFeedback);

  async function handleDelete(associate: Associate) {
    setDeletingId(associate.id);
    setFeedback(null);

    try {
      const result = await deleteAssociateAction(associate.id);

      if (!result.success) {
        if (result.notFound) {
          setAssociates((current) =>
            current.filter((item) => item.id !== associate.id),
          );
        }

        setFeedback({
          type: "error",
          message: result.formError,
        });
        router.refresh();
        return;
      }

      setAssociates((current) =>
        current.filter((item) => item.id !== associate.id),
      );
      setFeedback({
        type: "success",
        message: "Associado excluido com sucesso.",
      });
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="rounded-[32px] border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm lg:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Listagem
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--color-foreground)]">
            Associados cadastrados
          </h2>
          {hasActiveFilters ? (
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Exibindo resultados filtrados por busca e criterios selecionados.
            </p>
          ) : null}
        </div>
        <span className="inline-flex w-fit rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
          {associates.length} registro(s)
        </span>
      </div>

      {feedback ? (
        <div className="mt-6">
          <FeedbackAlert type={feedback.type} message={feedback.message} />
        </div>
      ) : null}

      <div className="mt-6">
        {associates.length === 0 ? (
          <EmptyState
            title="Nenhum associado encontrado"
            description={
              hasActiveFilters
                ? "Nenhum associado corresponde aos filtros atuais. Ajuste a busca ou limpe os filtros para ampliar a listagem."
                : "Assim que os primeiros associados forem cadastrados, a tabela aparecera aqui com nome, CPF, categoria, matricula e situacao."
            }
          />
        ) : (
          <AssociatesTable
            associates={associates}
            deletingId={deletingId}
            onDeleteAssociate={handleDelete}
          />
        )}
      </div>
    </section>
  );
}

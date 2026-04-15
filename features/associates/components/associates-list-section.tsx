"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { deleteAssociateAction } from "@/features/associates/actions/delete-associate";
import { AssociatesTable } from "@/features/associates/components/associates-table";
import { EmptyState } from "@/features/associates/components/empty-state";
import { FeedbackAlert } from "@/features/associates/components/feedback-alert";
import type { Associate } from "@/features/associates/types";

type AssociatesListSectionProps = {
  initialAssociates: Associate[];
  hasActiveFilters: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  accessMessage?: string | null;
  loadError?: string | null;
  initialFeedback?: {
    type: "success" | "error" | "info";
    message: string;
  } | null;
};

export function AssociatesListSection({
  initialAssociates,
  hasActiveFilters,
  canCreate,
  canEdit,
  canDelete,
  accessMessage = null,
  loadError = null,
  initialFeedback = null,
}: AssociatesListSectionProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [associates, setAssociates] = useState(initialAssociates);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(initialFeedback);

  useEffect(() => {
    if (!initialFeedback || !searchParams.has("success")) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete("success");
    const nextQuery = params.toString();

    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
  }, [initialFeedback, pathname, router, searchParams]);

  async function handleDelete(associate: Associate) {
    if (!canDelete) {
      setFeedback({
        type: "info",
        message: accessMessage ?? "Seu perfil não pode excluir associados.",
      });
      return;
    }

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

      setAssociates((current) => current.filter((item) => item.id !== associate.id));
      setFeedback({
        type: "success",
        message: "Associado excluído com sucesso.",
      });
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  const emptyState = hasActiveFilters
    ? {
        eyebrow: "Sem resultados",
        title: "Nenhum associado corresponde aos filtros atuais",
        description:
          "Revise a busca por nome, CPF, categoria ou situação. Limpar os filtros pode ajudar a reencontrar os registros da base.",
        action: (
          <Link href="/associados" className="df-button-secondary">
            Limpar filtros
          </Link>
        ),
      }
    : {
        eyebrow: "Primeiros passos",
        title: "Sua base de associados ainda está vazia",
        description:
          "Comece cadastrando o primeiro associado para liberar a operação do módulo com histórico, filtros e ações administrativas.",
        action: canCreate ? (
          <Link href="/associados/novo" className="df-button-primary">
            Criar primeiro associado
          </Link>
        ) : null,
      };

  return (
    <section className="df-section-card p-6 lg:p-7">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="df-eyebrow">Listagem</p>
          <h2 className="mt-2 text-[1.8rem] font-semibold tracking-tight text-[var(--color-foreground)]">
            Associados cadastrados
          </h2>
          {hasActiveFilters ? (
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
              Exibindo resultados filtrados por busca e critérios selecionados.
            </p>
          ) : (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
              Acompanhe a base operacional de associados com ações administrativas e
              feedbacks consistentes.
            </p>
          )}
        </div>
        <span className="df-badge-pill w-fit bg-[#FFF7ED] text-[#C2410C]">
          {associates.length} registro(s)
        </span>
      </div>

      {loadError ? (
        <div className="mt-6">
          <FeedbackAlert
            type="error"
            title="Não foi possível carregar a listagem"
            message={loadError}
            action={
              <Link href="/associados" className="df-button-secondary">
                Tentar novamente
              </Link>
            }
          />
        </div>
      ) : null}

      {accessMessage ? (
        <div className="mt-6">
          <FeedbackAlert
            type="info"
            title="Acesso restrito"
            message={accessMessage}
          />
        </div>
      ) : null}

      {feedback ? (
        <div className="mt-6">
          <FeedbackAlert
            type={feedback.type}
            title={feedback.type === "success" ? "Operação concluída" : undefined}
            message={feedback.message}
          />
        </div>
      ) : null}

      <div className="mt-6">
        {associates.length === 0 ? (
          <EmptyState
            eyebrow={emptyState.eyebrow}
            title={emptyState.title}
            description={emptyState.description}
            action={emptyState.action}
          />
        ) : (
          <AssociatesTable
            associates={associates}
            canEdit={canEdit}
            canDelete={canDelete}
            deniedReason={accessMessage}
            deletingId={deletingId}
            onDeleteAssociate={handleDelete}
          />
        )}
      </div>
    </section>
  );
}

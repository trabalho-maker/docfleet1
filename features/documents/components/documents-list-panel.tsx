"use client";

import type { FleetDocument } from "@/features/data/types";
import { DocumentStatusBadge } from "@/features/documents/components/document-status-badge";

type DocumentsListPanelProps = {
  documents: FleetDocument[];
  totalDocuments: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  canViewDocuments: boolean;
  canManageDocuments: boolean;
  accessMessage?: string | null;
  onEditDocument: (document: FleetDocument) => void;
  onDeleteDocument: (documentId: string) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
};

export function DocumentsListPanel({
  documents,
  totalDocuments,
  page,
  totalPages,
  isLoading,
  canViewDocuments,
  canManageDocuments,
  accessMessage = null,
  onEditDocument,
  onDeleteDocument,
  onPreviousPage,
  onNextPage,
}: DocumentsListPanelProps) {
  return (
    <article className="df-section-card p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="df-eyebrow">Documentos cadastrados</p>
          <h2 className="mt-2 text-[1.8rem] font-semibold tracking-tight text-[var(--color-foreground)]">
            Lista completa
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Acompanhe os registros atuais, revise vencimentos e acione edições ou
            exclusões quando o perfil permitir.
          </p>
        </div>
        <span className="df-badge-pill bg-slate-100 text-slate-600">
          {documents.length} de {totalDocuments} itens
        </span>
      </div>

      <div className="mt-6 grid gap-4">
        {!canViewDocuments ? (
          <div className="rounded-[24px] border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            {accessMessage ?? "Seu perfil não pode acessar os documentos."}
          </div>
        ) : isLoading ? (
          <div className="rounded-[24px] border border-[var(--color-border)] bg-[linear-gradient(180deg,#FCFDFE_0%,#FFFFFF_100%)] p-6 text-sm text-[var(--color-muted)]">
            Carregando documentos...
          </div>
        ) : documents.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-[var(--color-border)] bg-[linear-gradient(180deg,#F8FAFC_0%,#FFFFFF_100%)] p-6 text-sm text-[var(--color-muted)]">
            Nenhum documento cadastrado ainda. Use o formulário ao lado para criar
            o primeiro registro.
          </div>
        ) : (
          documents.map((document) => (
            <div
              key={document.id}
              className="rounded-[26px] border border-[var(--color-border)] bg-[linear-gradient(180deg,#FCFDFE_0%,#FFFFFF_100%)] p-5 shadow-[0_12px_28px_rgba(15,23,42,0.03)] transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-base font-semibold text-[var(--color-foreground)]">
                      {document.name}
                    </p>
                    <DocumentStatusBadge status={document.status} />
                  </div>
                  <p className="text-sm text-[var(--color-muted)]">
                    Tipo: {document.type}
                  </p>
                  <p className="text-sm text-[var(--color-muted)]">
                    Responsável: {document.owner}
                  </p>
                  <p className="text-sm text-[var(--color-muted)]">
                    Vencimento: {formatDate(document.dueDate)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => onEditDocument(document)}
                    disabled={!canManageDocuments}
                    title={canManageDocuments ? undefined : accessMessage ?? undefined}
                    className="df-button-secondary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteDocument(document.id)}
                    disabled={!canManageDocuments}
                    title={canManageDocuments ? undefined : accessMessage ?? undefined}
                    className="inline-flex min-h-10 items-center justify-center rounded-full border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-[var(--color-border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--color-muted)]">
          Página {page} de {totalPages}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onPreviousPage}
            disabled={page <= 1 || isLoading}
            className="df-button-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={onNextPage}
            disabled={page >= totalPages || isLoading}
            className="df-button-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Próxima
          </button>
        </div>
      </div>
    </article>
  );
}

function formatDate(date: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: "UTC",
      dateStyle: "short",
    }).format(new Date(`${date}T00:00:00Z`));
  } catch {
    return date;
  }
}

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
    <article className="rounded-[32px] border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Documentos cadastrados
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--color-foreground)]">
            Lista completa
          </h2>
        </div>
        <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
          {documents.length} de {totalDocuments} itens
        </span>
      </div>

      <div className="mt-6 grid gap-4">
        {!canViewDocuments ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            {accessMessage ?? "Seu perfil nao pode acessar os documentos."}
          </div>
        ) : isLoading ? (
          <div className="rounded-2xl border border-[var(--color-border)] bg-white/90 p-6 text-sm text-[var(--color-muted)]">
            Carregando documentos...
          </div>
        ) : documents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-white/90 p-6 text-sm text-[var(--color-muted)]">
            Nenhum documento cadastrado ainda. Use o formulario ao lado para
            criar o primeiro registro.
          </div>
        ) : (
          documents.map((document) => (
            <div
              key={document.id}
              className="rounded-2xl border border-[var(--color-border)] bg-white/90 p-5"
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
                    Responsavel: {document.owner}
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
                    className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteDocument(document.id)}
                    disabled={!canManageDocuments}
                    title={canManageDocuments ? undefined : accessMessage ?? undefined}
                    className="inline-flex h-10 items-center justify-center rounded-full border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
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
          Pagina {page} de {totalPages}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onPreviousPage}
            disabled={page <= 1 || isLoading}
            className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={onNextPage}
            disabled={page >= totalPages || isLoading}
            className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Proxima
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

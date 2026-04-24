"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  DocumentFormErrors,
  DocumentFormValues,
  DocumentUiMessage,
  DocumentsApiResponse,
} from "@/features/documents/types";
import { DocumentStatusBadge } from "@/features/documents/components/document-status-badge";
import { getDocumentTypeLabel } from "@/features/documents/constants";

type DocumentFormPanelProps = {
  canViewDocuments: boolean;
  canManageDocuments: boolean;
  accessMessage?: string | null;
  editingDocument: DocumentsApiResponse["documents"][number] | null;
  formValues: DocumentFormValues;
  formErrors: DocumentFormErrors;
  isSubmitting: boolean;
  message: DocumentUiMessage | null;
  onFieldChange: <K extends keyof DocumentFormValues>(
    field: K,
    value: DocumentFormValues[K],
  ) => void;
  onCancelEdit: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export function DocumentFormPanel({
  canViewDocuments,
  canManageDocuments,
  accessMessage = null,
  editingDocument,
  formValues,
  formErrors,
  isSubmitting,
  message,
  onFieldChange,
  onCancelEdit,
  onSubmit,
}: DocumentFormPanelProps) {
  return (
    <article className="df-section-card p-6">
      <div className="space-y-2">
        <p className="df-eyebrow">
          {editingDocument ? "Editar documento" : "Base documental"}
        </p>
        <h2 className="text-[1.8rem] font-semibold tracking-tight text-[var(--color-foreground)]">
          {editingDocument
            ? "Atualize o vencimento selecionado"
            : "Documentos vinculados aos associados"}
        </h2>
        <p className="text-sm leading-6 text-[var(--color-muted)]">
          {editingDocument
            ? "Ajuste a data de vencimento e a observacao do registro selecionado."
            : "Novos documentos sao cadastrados pela etapa complementar do associado para manter uma unica origem documental."}
        </p>
      </div>

      {message ? (
        <div
          role="alert"
          className={`mt-6 rounded-[24px] px-4 py-3 text-sm ${
            message.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      {!canViewDocuments ? (
        <div className="mt-6 rounded-[24px] border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
          {accessMessage ?? "Seu perfil nao pode acessar os documentos."}
        </div>
      ) : null}

      {canViewDocuments && !canManageDocuments ? (
        <div className="mt-6 rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
          {accessMessage ??
            "Seu perfil pode consultar documentos, mas nao pode alterar a base documental."}
        </div>
      ) : null}

      {editingDocument ? (
        <form className="mt-6 grid gap-5" onSubmit={onSubmit} noValidate>
          <div className="df-surface-card px-4 py-4">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-semibold text-[var(--color-foreground)]">
                {getDocumentTypeLabel(editingDocument.documentType)}
              </p>
              <DocumentStatusBadge status={editingDocument.status} />
            </div>
            <p className="mt-3 text-sm text-[var(--color-muted)]">
              {editingDocument.associateName ?? "Associado nao informado"}
              {editingDocument.associateCategory
                ? ` · ${editingDocument.associateCategory}`
                : ""}
            </p>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Matricula: {editingDocument.associateRegistrationNumber ?? "Nao informada"}
            </p>
          </div>

          <Input
            id="document-due-date"
            label="Data de vencimento"
            type="date"
            value={formValues.dueDate}
            onChange={(event) => onFieldChange("dueDate", event.target.value)}
            error={formErrors.dueDate}
            disabled={!canManageDocuments}
            required
          />

          <label htmlFor="document-notes" className="grid gap-2 text-sm font-medium text-slate-700">
            <span>Observacao</span>
            <textarea
              id="document-notes"
              value={formValues.notes}
              onChange={(event) => onFieldChange("notes", event.target.value)}
              disabled={!canManageDocuments}
              rows={5}
              className="min-h-[120px] rounded-[18px] border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-[var(--color-accent-strong)]"
              placeholder="Observacoes operacionais do documento"
            />
            {formErrors.notes ? (
              <span className="text-sm text-red-600">{formErrors.notes}</span>
            ) : null}
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="submit"
              isLoading={isSubmitting}
              loadingLabel="Salvando..."
              disabled={!canManageDocuments}
              className="sm:flex-1"
            >
              Salvar alteracoes
            </Button>

            <button
              type="button"
              onClick={onCancelEdit}
              disabled={!canManageDocuments}
              className="df-button-secondary min-h-12 justify-center rounded-[14px] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-6 rounded-[24px] border border-dashed border-[var(--color-border)] bg-[linear-gradient(180deg,#F8FAFC_0%,#FFFFFF_100%)] p-6">
          <p className="text-sm font-semibold text-[var(--color-foreground)]">
            Selecione um documento da lista para editar
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Para criar documentos novos, acesse a etapa complementar do associado.
          </p>
          <div className="mt-4">
            <Link href="/associados" className="df-button-secondary">
              Abrir associados
            </Link>
          </div>
        </div>
      )}
    </article>
  );
}

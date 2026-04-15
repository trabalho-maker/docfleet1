"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FleetDocument } from "@/features/data/types";
import { DocumentStatusBadge } from "@/features/documents/components/document-status-badge";
import type {
  DocumentFormErrors,
  DocumentFormValues,
  DocumentUiMessage,
} from "@/features/documents/types";

type DocumentFormPanelProps = {
  canViewDocuments: boolean;
  canManageDocuments: boolean;
  accessMessage?: string | null;
  editingId: string | null;
  formValues: DocumentFormValues;
  formErrors: DocumentFormErrors;
  calculatedStatus: FleetDocument["status"] | null;
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
  editingId,
  formValues,
  formErrors,
  calculatedStatus,
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
          {canManageDocuments
            ? editingId
              ? "Editar documento"
              : "Novo documento"
            : "Permissões do módulo"}
        </p>
        <h2 className="text-[1.8rem] font-semibold tracking-tight text-[var(--color-foreground)]">
          {canManageDocuments
            ? editingId
              ? "Atualize os dados do documento selecionado"
              : "Cadastre um documento da operação"
            : "Visualização somente leitura"}
        </h2>
        <p className="text-sm leading-6 text-[var(--color-muted)]">
          {canManageDocuments
            ? "Preencha os campos do documento e acompanhe o status calculado automaticamente a partir do vencimento."
            : "Seu perfil pode acompanhar os registros existentes, mas não pode alterar a base documental."}
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
          {accessMessage ?? "Seu perfil não pode acessar os documentos."}
        </div>
      ) : null}

      {canViewDocuments && !canManageDocuments ? (
        <div className="mt-6 rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
          {accessMessage ??
            "Seu perfil pode consultar documentos, mas não pode criar, editar ou excluir registros."}
        </div>
      ) : null}

      <form className="mt-6 grid gap-5" onSubmit={onSubmit} noValidate>
        <Input
          id="document-name"
          label="Nome"
          value={formValues.name}
          onChange={(event) => onFieldChange("name", event.target.value)}
          placeholder="Ex.: Licenciamento da frota leve"
          error={formErrors.name}
          disabled={!canManageDocuments}
          required
        />

        <Input
          id="document-type"
          label="Tipo"
          value={formValues.type}
          onChange={(event) => onFieldChange("type", event.target.value)}
          placeholder="Ex.: Veículos"
          error={formErrors.type}
          disabled={!canManageDocuments}
          required
        />

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

        <div className="df-surface-card px-4 py-4">
          <p className="text-sm font-semibold text-[var(--color-foreground)]">
            Status calculado automaticamente
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            {calculatedStatus ? (
              <DocumentStatusBadge status={calculatedStatus} />
            ) : (
              <span className="df-badge-pill bg-slate-200 text-slate-600">
                Informe a data
              </span>
            )}
            <p className="text-sm leading-6 text-[var(--color-muted)]">
              O sistema compara a data atual com o vencimento para classificar o
              documento como válido, em atenção ou vencido.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="submit"
            isLoading={isSubmitting}
            loadingLabel={editingId ? "Salvando..." : "Criando..."}
            disabled={!canManageDocuments}
            className="sm:flex-1"
          >
            {editingId ? "Salvar alterações" : "Criar documento"}
          </Button>

          {editingId ? (
            <button
              type="button"
              onClick={onCancelEdit}
              disabled={!canManageDocuments}
              className="df-button-secondary min-h-12 justify-center rounded-[14px] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
          ) : null}
        </div>
      </form>
    </article>
  );
}

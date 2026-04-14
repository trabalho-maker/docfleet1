"use client";

import { useEffect, useMemo, useState } from "react";
import { type FleetDocument } from "@/features/data/types";
import { DocumentFormPanel } from "@/features/documents/components/document-form-panel";
import { DocumentManagerHeader } from "@/features/documents/components/document-manager-header";
import { DocumentsListPanel } from "@/features/documents/components/documents-list-panel";
import { calculateDocumentStatus } from "@/features/documents/lib/expiration";
import type {
  DocumentApiResponse,
  DocumentFormErrors,
  DocumentFormValues,
  DocumentUiMessage,
  DocumentsApiResponse,
} from "@/features/documents/types";

type DocumentManagerProps = {
  userName: string;
  canViewDocuments: boolean;
  canManageDocuments: boolean;
  accessMessage?: string | null;
};

const initialValues: DocumentFormValues = {
  name: "",
  type: "",
  dueDate: "",
};

export function DocumentManager({
  userName,
  canViewDocuments,
  canManageDocuments,
  accessMessage = null,
}: DocumentManagerProps) {
  const pageSize = 25;
  const [documents, setDocuments] = useState<FleetDocument[]>([]);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [documentsRequiringAttention, setDocumentsRequiringAttention] = useState(0);
  const [documentsInAttention, setDocumentsInAttention] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [formValues, setFormValues] = useState<DocumentFormValues>(initialValues);
  const [formErrors, setFormErrors] = useState<DocumentFormErrors>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<DocumentUiMessage | null>(null);

  useEffect(() => {
    if (!canViewDocuments) {
      setIsLoading(false);
      setDocuments([]);
      return;
    }

    let active = true;

    async function loadDocuments(targetPage: number) {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/documents?page=${targetPage}&pageSize=${pageSize}`,
          {
            credentials: "include",
          },
        );
        const payload = (await response.json()) as
          | DocumentsApiResponse
          | { error?: string };

        if (!response.ok || !("documents" in payload)) {
          throw new Error(
            "error" in payload && payload.error
              ? payload.error
              : "Nao foi possivel carregar os documentos.",
          );
        }

        if (active) {
          setDocuments(payload.documents);
          setPage(payload.pagination.page);
          setTotalDocuments(payload.summary.total);
          setDocumentsRequiringAttention(payload.summary.requiringAttention);
          setDocumentsInAttention(payload.summary.attention);
          setTotalPages(payload.pagination.totalPages);
        }
      } catch (error) {
        if (active) {
          setMessage({
            type: "error",
            text:
              error instanceof Error
                ? error.message
                : "Nao foi possivel carregar os documentos.",
          });
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadDocuments(page);

    return () => {
      active = false;
    };
  }, [canViewDocuments, page, pageSize, reloadKey]);

  const metrics = useMemo(() => {
    return [
      { label: "Documentos", value: String(totalDocuments) },
      { label: "Requer atencao", value: String(documentsRequiringAttention) },
      { label: "Em atencao", value: String(documentsInAttention) },
    ];
  }, [documentsInAttention, documentsRequiringAttention, totalDocuments]);

  const calculatedStatus = useMemo(() => {
    if (!formValues.dueDate) {
      return null;
    }

    return calculateDocumentStatus(formValues.dueDate);
  }, [formValues.dueDate]);

  function updateField<K extends keyof DocumentFormValues>(
    field: K,
    value: DocumentFormValues[K],
  ) {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
    setFormErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  }

  function resetForm() {
    setFormValues(initialValues);
    setFormErrors({});
    setEditingId(null);
  }

  function fillForm(document: FleetDocument) {
    setFormValues({
      name: document.name,
      type: document.type,
      dueDate: document.dueDate,
    });
    setFormErrors({});
    setEditingId(document.id);
    setMessage(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canManageDocuments) {
      setMessage({
        type: "error",
        text:
          accessMessage ??
          "Seu perfil nao pode criar ou editar documentos.",
      });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    const method = editingId ? "PUT" : "POST";
    const endpoint = editingId ? `/api/documents/${editingId}` : "/api/documents";

    try {
      const response = await fetch(endpoint, {
        method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formValues),
      });

      const payload = (await response.json()) as
        | DocumentApiResponse
        | { error?: string; fieldErrors?: DocumentFormErrors };

      if (!response.ok) {
        setFormErrors(("fieldErrors" in payload ? payload.fieldErrors : {}) ?? {});
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "Nao foi possivel salvar o documento.",
        );
      }

      if (!("document" in payload)) {
        throw new Error("Resposta invalida ao salvar o documento.");
      }

      setPage(1);
      setReloadKey((current) => current + 1);
      setMessage({
        type: "success",
        text: editingId
          ? "Documento atualizado com sucesso."
          : "Documento criado com sucesso.",
      });
      resetForm();
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Nao foi possivel salvar o documento.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(documentId: string) {
    if (!canManageDocuments) {
      setMessage({
        type: "error",
        text:
          accessMessage ??
          "Seu perfil nao pode excluir documentos.",
      });
      return;
    }

    const confirmed = window.confirm(
      "Deseja realmente excluir este documento?",
    );

    if (!confirmed) {
      return;
    }

    setMessage(null);

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Nao foi possivel excluir o documento.");
      }

      if (editingId === documentId) {
        resetForm();
      }

      if (documents.length === 1 && page > 1) {
        setPage((current) => Math.max(1, current - 1));
      } else {
        setReloadKey((current) => current + 1);
      }

      setMessage({
        type: "success",
        text: "Documento removido com sucesso.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Nao foi possivel excluir o documento.",
      });
    }
  }

  return (
    <div className="flex w-full flex-col gap-8">
      <DocumentManagerHeader userName={userName} />

      <section className="grid gap-5 md:grid-cols-3">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
              {metric.label}
            </p>
            <p className="mt-4 text-4xl font-semibold tracking-tight text-[var(--color-foreground)]">
              {metric.value}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <DocumentFormPanel
          canViewDocuments={canViewDocuments}
          canManageDocuments={canManageDocuments}
          accessMessage={accessMessage}
          editingId={editingId}
          formValues={formValues}
          formErrors={formErrors}
          calculatedStatus={calculatedStatus}
          isSubmitting={isSubmitting}
          message={message}
          onFieldChange={updateField}
          onCancelEdit={resetForm}
          onSubmit={handleSubmit}
        />

        <DocumentsListPanel
          documents={documents}
          totalDocuments={totalDocuments}
          page={page}
          totalPages={totalPages}
          isLoading={isLoading}
          canViewDocuments={canViewDocuments}
          canManageDocuments={canManageDocuments}
          accessMessage={accessMessage}
          onEditDocument={fillForm}
          onDeleteDocument={(documentId) => {
            void handleDelete(documentId);
          }}
          onPreviousPage={() => setPage((current) => Math.max(1, current - 1))}
          onNextPage={() =>
            setPage((current) => Math.min(totalPages, current + 1))
          }
        />
      </section>
    </div>
  );
}

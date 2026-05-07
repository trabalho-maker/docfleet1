"use client";

import { useEffect, useMemo, useState } from "react";
import { MetricCard } from "@/features/dashboard/components/metric-card";
import { DocumentFormPanel } from "@/features/documents/components/document-form-panel";
import { DocumentManagerHeader } from "@/features/documents/components/document-manager-header";
import { DocumentsListPanel } from "@/features/documents/components/documents-list-panel";
import type {
  DocumentApiResponse,
  DocumentFormErrors,
  DocumentFormValues,
  DocumentListFilters,
  DocumentUiMessage,
  DocumentsApiResponse,
} from "@/features/documents/types";

type DocumentManagerProps = {
  userName: string;
  userEmail: string;
  userRole: string;
  canViewDocuments: boolean;
  canManageDocuments: boolean;
  accessMessage?: string | null;
};

const initialValues: DocumentFormValues = {
  dueDate: "",
  notes: "",
};

export function DocumentManager({
  userName,
  userEmail,
  userRole,
  canViewDocuments,
  canManageDocuments,
  accessMessage = null,
}: DocumentManagerProps) {
  const pageSize = 25;
  const [documents, setDocuments] = useState<DocumentsApiResponse["documents"]>([]);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [filters, setFilters] = useState<DocumentListFilters>({
    category: "",
  });
  const [summary, setSummary] = useState<DocumentsApiResponse["summary"]>({
    total: 0,
    expired: 0,
    dueIn15Days: 0,
    dueIn30Days: 0,
  });
  const [totalPages, setTotalPages] = useState(1);
  const [formValues, setFormValues] = useState<DocumentFormValues>(initialValues);
  const [formErrors, setFormErrors] = useState<DocumentFormErrors>({});
  const [editingDocument, setEditingDocument] =
    useState<DocumentsApiResponse["documents"][number] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<DocumentUiMessage | null>(null);

  const editingDocumentId = editingDocument?.id ?? null;

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
        const categoryQuery = filters.category
          ? `&category=${encodeURIComponent(filters.category)}`
          : "";
        const response = await fetch(
          `/api/documents?page=${targetPage}&pageSize=${pageSize}${categoryQuery}`,
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
              : "Não foi possível carregar os documentos.",
          );
        }

        if (active) {
          setDocuments(payload.documents);
          setPage(payload.pagination.page);
          setSummary(payload.summary);
          setTotalPages(payload.pagination.totalPages);

          if (editingDocumentId) {
            const refreshedSelection =
              payload.documents.find((document) => document.id === editingDocumentId) ?? null;

            setEditingDocument(refreshedSelection);

            if (refreshedSelection) {
              setFormValues({
                dueDate: refreshedSelection.dueDate,
                notes: refreshedSelection.notes ?? "",
              });
            }
          }
        }
      } catch (error) {
        if (active) {
          setMessage({
            type: "error",
            text:
              error instanceof Error
                ? error.message
                : "Não foi possível carregar os documentos.",
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
  }, [canViewDocuments, editingDocumentId, filters.category, page, pageSize, reloadKey]);

  const metrics = useMemo(
    () => [
      { label: "Documentos", value: String(summary.total) },
      { label: "Vencidos", value: String(summary.expired) },
      { label: "Até 15 dias", value: String(summary.dueIn15Days) },
      { label: "16 a 30 dias", value: String(summary.dueIn30Days) },
    ],
    [summary],
  );

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
    setEditingDocument(null);
  }

  function fillForm(document: DocumentsApiResponse["documents"][number]) {
    setFormValues({
      dueDate: document.dueDate,
      notes: document.notes ?? "",
    });
    setFormErrors({});
    setEditingDocument(document);
    setMessage(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingDocument) {
      setMessage({
        type: "error",
        text: "Selecione um documento para editar.",
      });
      return;
    }

    if (!canManageDocuments) {
      setMessage({
        type: "error",
        text: accessMessage ?? "Seu perfil não pode editar documentos.",
      });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/documents/${editingDocument.id}`, {
        method: "PUT",
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
            : "Não foi possível salvar o documento.",
        );
      }

      if (!("document" in payload)) {
        throw new Error("Resposta inválida ao salvar o documento.");
      }

      setReloadKey((current) => current + 1);
      setMessage({
        type: "success",
        text: "Documento atualizado com sucesso.",
      });
      fillForm(payload.document);
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Não foi possível salvar o documento.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(documentId: string) {
    if (!canManageDocuments) {
      setMessage({
        type: "error",
        text: accessMessage ?? "Seu perfil não pode excluir documentos.",
      });
      return;
    }

    const confirmed = window.confirm("Deseja realmente excluir este documento?");

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
        throw new Error(payload.error || "Não foi possível excluir o documento.");
      }

      if (editingDocument?.id === documentId) {
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
            : "Não foi possível excluir o documento.",
      });
    }
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <DocumentManagerHeader
        userName={userName}
        userEmail={userEmail}
        userRole={userRole}
      />

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            metric={{
              label: metric.label,
              value: metric.value,
            }}
          />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <DocumentFormPanel
          canViewDocuments={canViewDocuments}
          canManageDocuments={canManageDocuments}
          accessMessage={accessMessage}
          editingDocument={editingDocument}
          formValues={formValues}
          formErrors={formErrors}
          isSubmitting={isSubmitting}
          message={message}
          onFieldChange={updateField}
          onCancelEdit={resetForm}
          onSubmit={handleSubmit}
        />

        <DocumentsListPanel
          documents={documents}
          summary={summary}
          filters={filters}
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
          onFilterChange={(nextCategory) => {
            setPage(1);
            setFilters({ category: nextCategory });
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

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type DocumentStatus, type FleetDocument } from "@/features/data/types";
import { calculateDocumentStatus } from "@/features/documents/lib/expiration";
import type {
  DocumentApiResponse,
  DocumentFormValues,
  DocumentsApiResponse,
} from "@/features/documents/types";

type DocumentManagerProps = {
  userName: string;
};

type FormErrors = Partial<Record<keyof DocumentFormValues, string>>;

const initialValues: DocumentFormValues = {
  name: "",
  type: "",
  dueDate: "",
};

export function DocumentManager({ userName }: DocumentManagerProps) {
  const [documents, setDocuments] = useState<FleetDocument[]>([]);
  const [formValues, setFormValues] = useState<DocumentFormValues>(initialValues);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    let active = true;

    async function loadDocuments() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/documents", {
          credentials: "include",
        });
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

    void loadDocuments();

    return () => {
      active = false;
    };
  }, []);

  const metrics = useMemo(() => {
    const requiringAttention = documents.filter((item) => item.status !== "Valido").length;
    const attention = documents.filter((item) => item.status === "Atencao").length;

    return [
      { label: "Documentos", value: String(documents.length) },
      { label: "Requer atencao", value: String(requiringAttention) },
      { label: "Em atencao", value: String(attention) },
    ];
  }, [documents]);

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
        | { error?: string; fieldErrors?: FormErrors };

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

      setDocuments((current) => {
        if (editingId) {
          return current
            .map((item) => (item.id === payload.document.id ? payload.document : item))
            .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
        }

        return [...current, payload.document].sort((a, b) =>
          a.dueDate.localeCompare(b.dueDate),
        );
      });

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

      setDocuments((current) => current.filter((item) => item.id !== documentId));
      if (editingId === documentId) {
        resetForm();
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
      <section className="rounded-[32px] border border-[var(--color-border)] bg-[var(--color-card)] p-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
              CRUD de documentos
            </p>
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-[var(--color-foreground)]">
                Gestao documental
              </h1>
              <p className="mt-2 max-w-3xl text-base leading-7 text-[var(--color-muted)]">
                Crie, edite e exclua documentos com persistencia em SQLite e rotas
                API protegidas. Tudo conectado ao core atual do DocFleet.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-white/80 px-5 py-4 text-sm text-[var(--color-muted)]">
            <p className="font-semibold text-[var(--color-foreground)]">{userName}</p>
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-white px-4 text-sm font-semibold text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-surface-strong)]"
            >
              Voltar ao dashboard
            </Link>
          </div>
        </div>
      </section>

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
        <article className="rounded-[32px] border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
              {editingId ? "Editar documento" : "Novo documento"}
            </p>
            <h2 className="text-2xl font-semibold text-[var(--color-foreground)]">
              {editingId
                ? "Atualize os dados do documento selecionado"
                : "Cadastre um documento da operacao"}
            </h2>
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

          <form className="mt-6 grid gap-5" onSubmit={handleSubmit} noValidate>
            <Input
              id="document-name"
              label="Nome"
              value={formValues.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Ex.: Licenciamento da frota leve"
              error={formErrors.name}
              required
            />

            <Input
              id="document-type"
              label="Tipo"
              value={formValues.type}
              onChange={(event) => updateField("type", event.target.value)}
              placeholder="Ex.: Veiculos"
              error={formErrors.type}
              required
            />

            <Input
              id="document-due-date"
              label="Data de vencimento"
              type="date"
              value={formValues.dueDate}
              onChange={(event) => updateField("dueDate", event.target.value)}
              error={formErrors.dueDate}
              required
            />

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm font-medium text-slate-700">
                Status calculado automaticamente
              </p>
              <div className="mt-3 flex items-center gap-3">
                {calculatedStatus ? (
                  <StatusBadge status={calculatedStatus} />
                ) : (
                  <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                    Informe a data
                  </span>
                )}
                <p className="text-sm text-slate-500">
                  O backend compara a data atual com o vencimento e define se o
                  documento esta valido, em atencao ou vencido.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="submit"
                isLoading={isSubmitting}
                loadingLabel={editingId ? "Salvando..." : "Criando..."}
                className="sm:flex-1"
              >
                {editingId ? "Salvar alteracoes" : "Criar documento"}
              </Button>

              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Cancelar
                </button>
              ) : null}
            </div>
          </form>
        </article>

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
              {documents.length} itens
            </span>
          </div>

          <div className="mt-6 grid gap-4">
            {isLoading ? (
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
                        <StatusBadge status={document.status} />
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
                        onClick={() => fillForm(document)}
                        className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(document.id)}
                        className="inline-flex h-10 items-center justify-center rounded-full border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: DocumentStatus }) {
  const tone = {
    Valido: "bg-emerald-100 text-emerald-700",
    Atencao: "bg-amber-100 text-amber-700",
    Vencido: "bg-red-100 text-red-700",
  }[status];

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>
      {status}
    </span>
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

"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { AssociateStatusBadge } from "@/features/associates/components/associate-status-badge";
import { AssociateActionsMenu } from "@/features/associates/operations/components/associate-actions-menu";
import type {
  AssociateOperationEntry,
  AssociateOperationRequirement,
  AssociateOperationRequirementStatus,
} from "@/features/associates/operations/types";

type AssociateOperationDirectoryProps = {
  title: string;
  description: string;
  entries: AssociateOperationEntry[];
  emptyStateTitle: string;
  emptyStateDescription: string;
  documentsHrefBase?: string;
  loading?: boolean;
};

type DocumentationFilterValue =
  | ""
  | AssociateOperationRequirementStatus;

type PriorityFilterValue =
  | ""
  | "critical"
  | "attention"
  | "regular"
  | "missing_date";

export function AssociateOperationDirectory({
  title,
  description,
  entries,
  emptyStateTitle,
  emptyStateDescription,
  documentsHrefBase,
  loading = false,
}: AssociateOperationDirectoryProps) {
  const [nameQuery, setNameQuery] = useState("");
  const [registrationQuery, setRegistrationQuery] = useState("");
  const [documentationFilter, setDocumentationFilter] =
    useState<DocumentationFilterValue>("");
  const [operationalFilter, setOperationalFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilterValue>("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const deferredNameQuery = useDeferredValue(nameQuery);
  const deferredRegistrationQuery = useDeferredValue(registrationQuery);

  const rows = useMemo(
    () =>
      entries.map((entry) => {
        const nextRequirement = getNextRequirement(entry.requirements);
        const nextDueDate = nextRequirement?.dueDate ?? null;

        return {
          entry,
          nextRequirement,
          nextDueDate,
          documentationStatus: entry.overallStatus,
          priority: getPriority(entry.overallStatus, nextDueDate),
        };
      }),
    [entries],
  );

  const filteredRows = useMemo(() => {
    const normalizedName = deferredNameQuery.trim().toLowerCase();
    const normalizedRegistration = deferredRegistrationQuery.trim().toLowerCase();

    return rows.filter((row) => {
      if (
        normalizedName &&
        !row.entry.associate.name.toLowerCase().includes(normalizedName)
      ) {
        return false;
      }

      if (
        normalizedRegistration &&
        !row.entry.associate.registrationNumber
          .toLowerCase()
          .includes(normalizedRegistration)
      ) {
        return false;
      }

      if (
        documentationFilter &&
        row.documentationStatus !== documentationFilter
      ) {
        return false;
      }

      if (operationalFilter && row.entry.associate.status !== operationalFilter) {
        return false;
      }

      if (priorityFilter && row.priority !== priorityFilter) {
        return false;
      }

      return true;
    });
  }, [
    deferredNameQuery,
    deferredRegistrationQuery,
    documentationFilter,
    operationalFilter,
    priorityFilter,
    rows,
  ]);

  const hasActiveFilters = Boolean(
    nameQuery || registrationQuery || documentationFilter || operationalFilter || priorityFilter,
  );

  const summary = useMemo(
    () => ({
      total: entries.length,
      filtered: filteredRows.length,
      critical: rows.filter((row) => row.documentationStatus === "Vencido").length,
      attention: rows.filter((row) => row.documentationStatus === "Atencao").length,
      pending: rows.filter((row) => row.documentationStatus === "Missing").length,
    }),
    [entries.length, filteredRows.length, rows],
  );

  return (
    <article className="df-section-card overflow-hidden">
      <div className="border-b border-[var(--color-border)] px-6 py-5 lg:px-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-[1.3rem] font-semibold tracking-tight text-[var(--color-foreground)]">
                {title}
              </h2>
              <span className="inline-flex items-center rounded-full bg-[#EEF4FB] px-3 py-1 text-xs font-semibold text-[#35577E]">
                {summary.filtered} de {summary.total}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
              {description}
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <SummaryChip label="Criticos" value={summary.critical} tone="danger" />
            <SummaryChip label="Em atencao" value={summary.attention} tone="warning" />
            <SummaryChip label="Pendentes" value={summary.pending} tone="neutral" />
          </div>
        </div>
      </div>

      <div className="border-b border-[var(--color-border)] bg-[linear-gradient(180deg,#FBFDFF_0%,#F8FAFC_100%)] px-6 py-5 lg:px-7">
        <div className="grid gap-3 xl:grid-cols-[1.2fr_0.9fr_0.8fr_0.85fr_0.85fr_auto]">
          <label className="df-input-shell">
            <SearchIcon />
            <input
              value={nameQuery}
              onChange={(event) => setNameQuery(event.target.value)}
              type="text"
              placeholder="Buscar por nome"
              className="w-full border-none bg-transparent text-sm outline-none placeholder:text-[var(--color-muted-soft)]"
            />
          </label>

          <label className="df-input-shell">
            <IdCardIcon />
            <input
              value={registrationQuery}
              onChange={(event) => setRegistrationQuery(event.target.value)}
              type="text"
              placeholder="Matricula"
              className="w-full border-none bg-transparent text-sm outline-none placeholder:text-[var(--color-muted-soft)]"
            />
          </label>

          <label className="df-select-shell">
            <select
              value={documentationFilter}
              onChange={(event) =>
                setDocumentationFilter(event.target.value as DocumentationFilterValue)
              }
              className="w-full border-none bg-transparent text-sm outline-none"
            >
              <option value="">Status documental</option>
              <option value="Valido">Regular</option>
              <option value="Atencao">Em atencao</option>
              <option value="Vencido">Critico</option>
              <option value="Missing">Pendente</option>
            </select>
          </label>

          <label className="df-select-shell">
            <select
              value={operationalFilter}
              onChange={(event) => setOperationalFilter(event.target.value)}
              className="w-full border-none bg-transparent text-sm outline-none"
            >
              <option value="">Status operacional</option>
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
              <option value="Suspenso">Suspenso</option>
              <option value="Bloqueado">Bloqueado</option>
            </select>
          </label>

          <label className="df-select-shell">
            <select
              value={priorityFilter}
              onChange={(event) =>
                setPriorityFilter(event.target.value as PriorityFilterValue)
              }
              className="w-full border-none bg-transparent text-sm outline-none"
            >
              <option value="">Prioridade</option>
              <option value="critical">Criticos e pendentes</option>
              <option value="attention">Em atencao</option>
              <option value="regular">Regulares</option>
              <option value="missing_date">Sem vencimento</option>
            </select>
          </label>

          <button
            type="button"
            onClick={() => {
              setNameQuery("");
              setRegistrationQuery("");
              setDocumentationFilter("");
              setOperationalFilter("");
              setPriorityFilter("");
            }}
            className="df-button-secondary min-h-12 rounded-[16px]"
          >
            Limpar filtros
          </button>
        </div>
      </div>

      {loading ? (
        <DirectoryLoadingState />
      ) : entries.length === 0 ? (
        <EmptyDirectoryState
          title={emptyStateTitle}
          description={emptyStateDescription}
          actionLabel="Abrir base de associados"
          actionHref="/associados"
        />
      ) : filteredRows.length === 0 ? (
        <EmptyDirectoryState
          title="Nenhum associado encontrado"
          description={
            hasActiveFilters
              ? "Ajuste os filtros para localizar um associado vinculado a esta operacao."
              : "Nao ha associados disponiveis para exibicao nesta visao."
          }
          actionLabel="Limpar filtros"
          actionOnClick={() => {
            setNameQuery("");
            setRegistrationQuery("");
            setDocumentationFilter("");
            setOperationalFilter("");
            setPriorityFilter("");
          }}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[920px] w-full border-collapse">
            <thead className="bg-[#F8FAFC] text-left">
              <tr className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                <th className="px-6 py-4 lg:px-7">Nome</th>
                <th className="px-6 py-4">Matricula</th>
                <th className="px-6 py-4">Situacao documental</th>
                <th className="px-6 py-4">Proximo vencimento</th>
                <th className="px-6 py-4">Status operacional</th>
                <th className="px-6 py-4 text-right lg:px-7">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr
                  key={row.entry.associate.id}
                  className="border-t border-[var(--color-border)] bg-white align-top text-sm text-[var(--color-foreground)] transition-colors hover:bg-[#FBFDFF]"
                >
                  <td className="px-6 py-4 lg:px-7">
                    <div>
                      <p className="font-semibold text-[var(--color-foreground)]">
                        {row.entry.associate.name}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="df-badge-pill bg-[#EEF4FB] text-[#35577E]">
                          {row.entry.associate.category}
                        </span>
                        {row.entry.requirements.length === 0 ? (
                          <span className="text-xs text-[var(--color-muted)]">
                            Sem requisitos configurados
                          </span>
                        ) : (
                          <span className="text-xs text-[var(--color-muted)]">
                            {row.entry.requirements.length} requisito(s)
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-[var(--color-foreground-soft)]">
                      {row.entry.associate.registrationNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <OperationalHealthBadge
                      status={row.documentationStatus}
                      hasRequirements={row.entry.requirements.length > 0}
                    />
                  </td>
                  <td className="px-6 py-4">
                    {row.nextRequirement ? (
                      <div>
                        <p className="font-medium text-[var(--color-foreground)]">
                          {formatDate(row.nextRequirement.dueDate as string)}
                        </p>
                        <p className="mt-1 text-xs text-[var(--color-muted)]">
                          {row.nextRequirement.label}
                        </p>
                        <p className="mt-1 text-xs font-medium text-[#35577E]">
                          {formatRelativeDueDate(row.nextRequirement.dueDate as string)}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium text-[var(--color-foreground)]">
                          Sem vencimento
                        </p>
                        <p className="mt-1 text-xs text-[var(--color-muted)]">
                          Nenhuma data cadastrada
                        </p>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <AssociateStatusBadge status={row.entry.associate.status} />
                  </td>
                  <td className="px-6 py-4 lg:px-7">
                    <AssociateActionsMenu
                      associateId={row.entry.associate.id}
                      associateName={row.entry.associate.name}
                      documentsHref={
                        documentsHrefBase
                          ? `${documentsHrefBase}?taxista=${encodeURIComponent(
                              row.entry.associate.id,
                            )}`
                          : "/documentos"
                      }
                      open={openMenuId === row.entry.associate.id}
                      onToggle={() =>
                        setOpenMenuId((current) =>
                          current === row.entry.associate.id
                            ? null
                            : row.entry.associate.id,
                        )
                      }
                      onClose={() => setOpenMenuId(null)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}

function SummaryChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "danger" | "warning" | "neutral";
}) {
  const classes =
    tone === "danger"
      ? "bg-[#FFF1F2] text-[#BE123C]"
      : tone === "warning"
        ? "bg-[#FFF7ED] text-[#B45309]"
        : "bg-[#EEF4FB] text-[#35577E]";

  return (
    <div className={`rounded-[18px] px-4 py-3 ${classes}`}>
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em]">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

function OperationalHealthBadge({
  status,
  hasRequirements,
}: {
  status: AssociateOperationRequirementStatus;
  hasRequirements: boolean;
}) {
  if (!hasRequirements) {
    return (
      <span className="df-badge-pill bg-slate-200 text-slate-700">
        Sem documentos
      </span>
    );
  }

  const tone =
    status === "Valido"
      ? {
          label: "Regular",
          classes: "bg-[#DCFCE7] text-[#166534]",
        }
      : status === "Atencao"
        ? {
            label: "Em atencao",
            classes: "bg-[#FEF3C7] text-[#92400E]",
          }
        : status === "Vencido"
          ? {
              label: "Critico",
              classes: "bg-[#FEE2E2] text-[#991B1B]",
            }
          : {
              label: "Pendente",
              classes: "bg-slate-200 text-slate-700",
            };

  return <span className={`df-badge-pill ${tone.classes}`}>{tone.label}</span>;
}

function EmptyDirectoryState({
  title,
  description,
  actionLabel,
  actionHref,
  actionOnClick,
}: {
  title: string;
  description: string;
  actionLabel: string;
  actionHref?: string;
  actionOnClick?: () => void;
}) {
  return (
    <div className="flex min-h-[320px] items-center justify-center px-6 py-10 lg:px-7">
      <div className="max-w-md text-center">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF4FB] text-[#35577E]">
          <FolderIcon />
        </div>
        <h3 className="mt-5 text-xl font-semibold tracking-tight text-[var(--color-foreground)]">
          {title}
        </h3>
        <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
          {description}
        </p>
        <div className="mt-6 flex justify-center">
          {actionHref ? (
            <Link href={actionHref} className="df-button-secondary">
              {actionLabel}
            </Link>
          ) : (
            <button type="button" onClick={actionOnClick} className="df-button-secondary">
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DirectoryLoadingState() {
  return (
    <div className="space-y-4 px-6 py-6 lg:px-7">
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="h-16 animate-pulse rounded-[22px] border border-[var(--color-border)] bg-[#F8FAFC]"
        />
      ))}
    </div>
  );
}

function getNextRequirement(requirements: AssociateOperationRequirement[]) {
  return [...requirements]
    .filter((requirement) => Boolean(requirement.dueDate))
    .sort((left, right) => getDateValue(left.dueDate) - getDateValue(right.dueDate))[0];
}

function getPriority(
  status: AssociateOperationRequirementStatus,
  nextDueDate: string | null,
): PriorityFilterValue {
  if (status === "Vencido" || status === "Missing") {
    return "critical";
  }

  if (status === "Atencao") {
    return "attention";
  }

  if (!nextDueDate) {
    return "missing_date";
  }

  return "regular";
}

function getDateValue(date: string | null) {
  if (!date) {
    return Number.POSITIVE_INFINITY;
  }

  return new Date(`${date}T00:00:00Z`).getTime();
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

function formatRelativeDueDate(date: string) {
  const dueDate = new Date(`${date}T00:00:00Z`);
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const target = Date.UTC(
    dueDate.getUTCFullYear(),
    dueDate.getUTCMonth(),
    dueDate.getUTCDate(),
  );
  const days = Math.round((target - today) / 86400000);

  if (days < 0) {
    return `Atrasado ha ${Math.abs(days)}d`;
  }

  if (days === 0) {
    return "Vence hoje";
  }

  if (days === 1) {
    return "Vence amanha";
  }

  return `Vence em ${days}d`;
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0 text-[var(--color-muted)]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function IdCardIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0 text-[var(--color-muted)]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
      <path d="M8 10.2h8M8 14h5" />
      <circle cx="7.2" cy="10.2" r="1.2" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3.5 7.5A2.5 2.5 0 0 1 6 5h4l1.8 2H18a2.5 2.5 0 0 1 2.5 2.5v7A2.5 2.5 0 0 1 18 19H6a2.5 2.5 0 0 1-2.5-2.5Z" />
    </svg>
  );
}

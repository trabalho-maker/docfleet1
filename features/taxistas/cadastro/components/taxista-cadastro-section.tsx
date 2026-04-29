"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useEffect, useState } from "react";
import type { AuthUser } from "@/features/auth/types";
import { canEditAssociate } from "@/features/associates/lib/associate-authorization";
import { clearTaxistaProntosAction } from "@/features/taxistas/cadastro/actions/clear-taxista-prontos";
import { updateTaxistaAlvaraStatusAction } from "@/features/taxistas/cadastro/actions/update-taxista-alvara-status";
import { TaxistaCadastroModal } from "@/features/taxistas/cadastro/components/taxista-cadastro-modal";
import {
  TaxistaAlvaraStatus,
  TaxistaCadastroCounts,
  TaxistaCadastroFilterMode,
  TaxistaCadastroRecord,
} from "@/features/taxistas/cadastro/types";

type TaxistaCadastroSectionProps = {
  user: AuthUser;
  records: TaxistaCadastroRecord[];
  counts: TaxistaCadastroCounts;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  initialSearch?: string;
  initialMode: TaxistaCadastroFilterMode;
  initialSelectedAssociateId?: string;
  selectedRecord: TaxistaCadastroRecord | null;
};

export function TaxistaCadastroSection({
  user,
  records,
  counts,
  total,
  page,
  pageSize,
  totalPages,
  initialSearch = "",
  initialMode,
  initialSelectedAssociateId,
  selectedRecord,
}: TaxistaCadastroSectionProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [isClearingReady, setIsClearingReady] = useState(false);
  const [pendingStatusById, setPendingStatusById] = useState<
    Partial<Record<string, TaxistaAlvaraStatus>>
  >({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const canEdit = canEditAssociate(user);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const selectedAssociateId =
    searchParams.get("taxista") ?? initialSelectedAssociateId ?? null;
  const normalizedSearch = deferredSearchQuery.trim();

  useEffect(() => {
    setSearchQuery(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    const currentQuery = searchParams.get("q") ?? "";

    if (currentQuery === normalizedSearch) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());

    if (normalizedSearch) {
      params.set("q", normalizedSearch);
    } else {
      params.delete("q");
    }

    params.delete("page");

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [normalizedSearch, pathname, router, searchParams]);

  function openModal(associateId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("taxista", associateId);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function closeModal() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("taxista");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  async function handleStatusUpdate(
    associateId: string,
    nextStatus: TaxistaAlvaraStatus,
  ) {
    setFeedback(null);
    setPendingStatusById((current) => ({
      ...current,
      [associateId]: nextStatus,
    }));

    try {
      const result = await updateTaxistaAlvaraStatusAction(associateId, nextStatus);

      if (!result.success) {
        setFeedback(result.formError);
        return;
      }

      router.refresh();
    } finally {
      setPendingStatusById((current) => {
        const next = { ...current };
        delete next[associateId];
        return next;
      });
    }
  }

  async function handleClearReady() {
    setFeedback(null);
    setIsClearingReady(true);

    try {
      const result = await clearTaxistaProntosAction();

      if (!result.success) {
        setFeedback(result.formError);
        return;
      }

      updateFilters({ mode: "ALL", page: 1 });
      router.refresh();
    } finally {
      setIsClearingReady(false);
    }
  }

  function updateFilters({
    search,
    mode,
    page: nextPage,
  }: {
    search?: string;
    mode?: TaxistaCadastroFilterMode;
    page?: number;
  }) {
    const params = new URLSearchParams(searchParams.toString());
    const resolvedSearch = search ?? searchQuery.trim();
    const resolvedMode = mode ?? initialMode;
    const resolvedPage = nextPage ?? page;

    if (resolvedSearch) {
      params.set("q", resolvedSearch);
    } else {
      params.delete("q");
    }

    if (resolvedMode !== "ALL") {
      params.set("mode", resolvedMode);
    } else {
      params.delete("mode");
    }

    if (resolvedPage > 1) {
      params.set("page", String(resolvedPage));
    } else {
      params.delete("page");
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function handleModeChange(mode: TaxistaCadastroFilterMode) {
    updateFilters({ mode, page: 1 });
  }

  return (
    <>
      <section className="space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          <AlvaraMetricCard
            title="TAXISTAS CADASTRADOS"
            value={counts.all}
            active={initialMode === "ALL"}
            onClick={() => handleModeChange("ALL")}
            tone="neutral"
          />
          <AlvaraMetricCard
            title="PROTOCOLADO"
            value={counts.protocolado}
            active={initialMode === "PROTOCOLADO"}
            onClick={() => handleModeChange("PROTOCOLADO")}
            tone="warning"
          />
          <AlvaraMetricCard
            title="PRONTO"
            value={counts.pronto}
            active={initialMode === "PRONTO"}
            onClick={() => handleModeChange("PRONTO")}
            tone="success"
          />
        </div>

        <section className="df-section-card overflow-hidden">
          <div className="border-b border-[var(--color-border)] px-6 py-5 lg:px-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-[1.35rem] font-semibold tracking-tight text-[var(--color-foreground)]">
                    Controle de alvaras
                  </h2>
                  <span className="inline-flex items-center rounded-full bg-[#EEF4FB] px-3 py-1 text-xs font-semibold text-[#35577E]">
                    {total} de {counts.all}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleClearReady}
                  disabled={!canEdit || counts.pronto === 0 || isClearingReady}
                  className="inline-flex min-h-11 items-center justify-center rounded-[16px] bg-[#F39C12] px-5 text-sm font-semibold text-[#163559] shadow-[0_14px_32px_rgba(243,156,18,0.24)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none disabled:hover:brightness-100"
                >
                  {isClearingReady ? "Limpando..." : "Limpar prontos"}
                </button>
              </div>
            </div>
          </div>

          {counts.all === 0 ? (
            <div className="flex min-h-[280px] items-center justify-center px-6 py-10 lg:px-7">
              <div className="max-w-md text-center">
                <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF4FB] text-[#35577E]">
                  <TaxiIcon />
                </div>
                <h3 className="mt-5 text-xl font-semibold tracking-tight text-[var(--color-foreground)]">
                  Nenhum taxista cadastrado
                </h3>
                <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                  Quando houver associados com modalidade TAXI, eles aparecerao aqui para o controle operacional de alvaras.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="border-b border-[var(--color-border)] bg-[linear-gradient(180deg,#FBFDFF_0%,#F8FAFC_100%)] px-6 py-5 lg:px-7">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <label className="df-input-shell max-w-2xl flex-1">
                    <SearchIcon />
                    <input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      type="text"
                      placeholder="Pesquisar por nome, CPF, selo ou placa"
                      className="w-full border-none bg-transparent text-sm outline-none placeholder:text-[var(--color-muted-soft)]"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      updateFilters({ search: "", mode: "ALL", page: 1 });
                    }}
                    className="df-button-secondary min-h-11 rounded-[16px]"
                  >
                    Limpar filtros
                  </button>
                </div>
              </div>

              {feedback ? (
                <div className="border-b border-[var(--color-border)] bg-[#FFF7ED] px-6 py-3 text-sm font-medium text-[#B45309] lg:px-7">
                  {feedback}
                </div>
              ) : null}

              {records.length === 0 ? (
                <div className="flex min-h-[240px] items-center justify-center px-6 py-10 lg:px-7">
                  <div className="max-w-md text-center">
                    <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF4FB] text-[#35577E]">
                      <SearchIcon />
                    </div>
                    <h3 className="mt-5 text-xl font-semibold tracking-tight text-[var(--color-foreground)]">
                      Nenhum taxista encontrado
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                      Ajuste a pesquisa ou o filtro de alvara para localizar um taxista.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1240px] border-collapse">
                    <thead className="bg-[#F8FAFC] text-left">
                      <tr className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                        <th className="px-6 py-4 lg:px-7">Nome</th>
                        <th className="px-6 py-4">CPF</th>
                        <th className="px-6 py-4">Telefone</th>
                        <th className="px-6 py-4">Selo</th>
                        <th className="px-6 py-4">Placa</th>
                        <th className="px-6 py-4">Ponto</th>
                        <th className="px-6 py-4">Nº Taximetro</th>
                        <th className="px-6 py-4">Alvara</th>
                        <th className="px-6 py-4 text-right lg:px-7">Acoes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((record) => {
                        const pendingStatus = pendingStatusById[record.associateId];
                        const isUpdating = Boolean(pendingStatus);
                        const canMoveToReady = record.statusAlvara === "PROTOCOLADO";

                        return (
                          <tr
                            key={record.associateId}
                            className="border-t border-[var(--color-border)] bg-white text-sm text-[var(--color-foreground)] transition-colors hover:bg-[#FBFDFF]"
                          >
                            <td className="px-6 py-4 lg:px-7">
                              <button
                                type="button"
                                onClick={() => openModal(record.associateId)}
                                className="text-left font-semibold text-[#1D4ED8] transition-colors hover:text-[#163559]"
                              >
                                {record.name}
                              </button>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span className="df-badge-pill bg-[#EEF4FB] text-[#35577E]">
                                  {record.registrationNumber}
                                </span>
                                <StatusPill status={record.status} />
                              </div>
                            </td>
                            <td className="px-6 py-4">{formatCpf(record.cpf)}</td>
                            <td className="px-6 py-4">{record.telefone ?? "Não informado"}</td>
                            <td className="px-6 py-4">{record.selo ?? "Não informado"}</td>
                            <td className="px-6 py-4">{record.placa ?? "Não informada"}</td>
                            <td className="px-6 py-4">{record.ponto ?? "Não informado"}</td>
                            <td className="px-6 py-4">
                              {record.numeroTaximetro ?? "Não informado"}
                            </td>
                            <td className="px-6 py-4">
                              <AlvaraStatusBadge status={record.statusAlvara} />
                            </td>
                            <td className="px-6 py-4 text-right lg:px-7">
                              <div className="flex flex-wrap justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleStatusUpdate(
                                      record.associateId,
                                      "PROTOCOLADO",
                                    )
                                  }
                                  disabled={!canEdit || isUpdating}
                                  className="inline-flex h-9 items-center justify-center rounded-full bg-[#F39C12] px-3 text-xs font-semibold text-[#163559] shadow-[0_10px_24px_rgba(243,156,18,0.22)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none disabled:hover:brightness-100"
                                >
                                  {pendingStatus === "PROTOCOLADO"
                                    ? "Salvando..."
                                    : "Adicionar ao protocolado"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleStatusUpdate(record.associateId, "PRONTO")
                                  }
                                  disabled={!canEdit || !canMoveToReady || isUpdating}
                                  className="inline-flex h-9 items-center justify-center rounded-full bg-[#F39C12] px-3 text-xs font-semibold text-[#163559] shadow-[0_10px_24px_rgba(243,156,18,0.22)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none disabled:hover:brightness-100"
                                >
                                  {pendingStatus === "PRONTO"
                                    ? "Salvando..."
                                    : "Adicionar ao pronto"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openModal(record.associateId)}
                                  className="inline-flex h-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-white px-3 text-xs font-semibold text-[var(--color-foreground)] transition-colors hover:border-[#DBEAFE] hover:bg-[#EFF6FF] hover:text-[#1D4ED8]"
                                >
                                  Abrir cadastro
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex flex-col gap-3 border-t border-[var(--color-border)] px-6 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-7">
                <p className="text-sm text-[var(--color-muted)]">
                  Pagina {page} de {totalPages} · {pageSize} por pagina
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => updateFilters({ page: page - 1 })}
                    disabled={page <= 1}
                    className="df-button-secondary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => updateFilters({ page: page + 1 })}
                    disabled={page >= totalPages}
                    className="df-button-secondary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Proxima
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </section>

      <TaxistaCadastroModal
        record={selectedRecord && selectedRecord.associateId === selectedAssociateId ? selectedRecord : null}
        canEdit={canEdit}
        open={Boolean(selectedRecord && selectedRecord.associateId === selectedAssociateId)}
        onClose={closeModal}
      />
    </>
  );
}

function AlvaraMetricCard({
  title,
  value,
  active,
  onClick,
  tone,
}: {
  title: string;
  value: number;
  active: boolean;
  onClick: () => void;
  tone: "neutral" | "warning" | "success";
}) {
  const toneClasses =
    tone === "warning"
      ? active
        ? "border-[#F59E0B] bg-[#FFF7ED] text-[#B45309]"
        : "border-[var(--color-border)] bg-white text-[#B45309]"
      : tone === "success"
        ? active
          ? "border-[#22C55E] bg-[#F0FDF4] text-[#15803D]"
          : "border-[var(--color-border)] bg-white text-[#15803D]"
        : active
          ? "border-[#93C5FD] bg-[#EFF6FF] text-[#1D4ED8]"
          : "border-[var(--color-border)] bg-white text-[#35577E]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`df-section-card flex min-h-[132px] flex-col items-start justify-between border px-5 py-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(15,23,42,0.08)] ${toneClasses}`}
    >
      <span className="text-[0.72rem] font-semibold uppercase tracking-[0.18em]">
        {title}
      </span>
      <span className="text-[2.1rem] font-bold tracking-[-0.05em]">{value}</span>
    </button>
  );
}

function AlvaraStatusBadge({
  status,
}: {
  status: TaxistaAlvaraStatus;
}) {
  const classes =
    status === "PRONTO"
      ? "bg-[#DCFCE7] text-[#166534]"
      : status === "PROTOCOLADO"
        ? "bg-[#FEF3C7] text-[#92400E]"
        : "bg-[#EEF4FB] text-[#35577E]";

  return <span className={`df-badge-pill ${classes}`}>{status}</span>;
}

function StatusPill({
  status,
}: {
  status: TaxistaCadastroRecord["status"];
}) {
  const classes =
    status === "Ativo"
      ? "bg-[#DCFCE7] text-[#166534]"
      : status === "Suspenso"
        ? "bg-[#FEF3C7] text-[#92400E]"
        : status === "Bloqueado"
          ? "bg-[#FEE2E2] text-[#991B1B]"
          : "bg-slate-200 text-slate-700";

  return <span className={`df-badge-pill ${classes}`}>{status}</span>;
}

function formatCpf(cpf: string) {
  const digits = cpf.replace(/\D/g, "");

  if (digits.length !== 11) {
    return cpf;
  }

  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function TaxiIcon() {
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
      <path d="M5 14.5 7 9h10l2 5.5" />
      <path d="M4.5 14.5h15a1.5 1.5 0 0 1 1.5 1.5v2h-2.5" />
      <path d="M3 18v-2a1.5 1.5 0 0 1 1.5-1.5" />
      <path d="M6.5 18h11" />
      <circle cx="7.5" cy="18" r="1.5" />
      <circle cx="16.5" cy="18" r="1.5" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0"
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

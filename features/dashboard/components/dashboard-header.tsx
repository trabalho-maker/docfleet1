"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import type { AuthUser } from "@/features/auth/types";
import type { OperationalAlert } from "@/features/data/types";
import type { DashboardOperationalSummary } from "@/features/dashboard/types";

type DashboardHeaderProps = {
  user: AuthUser;
  title: string;
  description: string;
  summary: DashboardOperationalSummary;
  alerts: OperationalAlert[];
};

export function DashboardHeader({
  user,
  title,
  description,
  summary,
  alerts,
}: DashboardHeaderProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const panelId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isPanelOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!panelRef.current?.contains(event.target as Node)) {
        setIsPanelOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsPanelOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPanelOpen]);

  const headline = buildOperationalHeadline(summary);
  const support = buildOperationalSupport(summary);
  const summaryChips = buildSummaryChips(summary);

  return (
    <header className="df-section-card overflow-hidden px-5 py-5 sm:px-6 lg:px-7 xl:px-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <p className="df-eyebrow">Cockpit diário</p>
          <h1 className="mt-2 text-[2rem] font-semibold tracking-tight text-[#163559] sm:text-[2.35rem]">
            {title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#64748B] sm:text-[0.95rem]">
            {description}
          </p>

          <div className="mt-4 flex flex-wrap gap-2.5">
            {summaryChips.map((chip) => (
              <OperationalChip
                key={chip.label}
                label={chip.label}
                tone={chip.tone}
              />
            ))}
          </div>
        </div>

        <div className="xl:w-[min(27rem,100%)] xl:shrink-0">
          <div className="rounded-[26px] border border-[#E2E8F0] bg-[#F8FAFC] p-4 shadow-[0_14px_32px_rgba(15,23,42,0.05)]">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#163559]">
                  Situação da operação
                </p>
                <p className="mt-2 text-sm font-medium text-[#0F172A]">
                  {headline}
                </p>
                <p className="mt-1 text-sm leading-6 text-[#64748B]">
                  {support}
                </p>
              </div>

              <div className="relative" ref={panelRef}>
                <button
                  type="button"
                  className="relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#E2E8F0] bg-white text-[#475569] shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition-colors hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35577E]/30"
                  aria-label="Abrir alertas monitorados"
                  aria-controls={panelId}
                  aria-expanded={isPanelOpen}
                  onClick={() => setIsPanelOpen((current) => !current)}
                >
                  <BellIcon />
                  {summary.alertCount > 0 ? (
                    <span className="absolute right-0 top-0 inline-flex min-h-5 min-w-5 -translate-y-1/4 translate-x-1/4 items-center justify-center rounded-full bg-[#EF4444] px-1 text-[0.65rem] font-semibold text-white">
                      {summary.alertCount}
                    </span>
                  ) : null}
                </button>

                {isPanelOpen ? (
                  <div
                    id={panelId}
                    className="absolute right-0 top-full z-30 mt-3 w-[min(24rem,calc(100vw-2rem))] max-w-sm overflow-hidden rounded-[24px] border border-[#E2E8F0] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.14)]"
                  >
                    <div className="border-b border-[#E2E8F0] px-5 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[#163559]">
                            Alertas monitorados
                          </p>
                          <p className="mt-1 text-xs text-[#64748B]">
                            Resumo rápido dos alertas documentais e operacionais mais relevantes.
                          </p>
                        </div>
                        <span className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-full bg-[#EF4444] px-2 text-sm font-semibold text-white">
                          {summary.alertCount}
                        </span>
                      </div>
                      {summary.alertCount > alerts.length ? (
                        <p className="mt-2 text-xs text-[#94A3B8]">
                          Mostrando {alerts.length} de {summary.alertCount} alertas relevantes.
                        </p>
                      ) : null}
                    </div>

                    <div className="max-h-[22rem] overflow-y-auto px-3 py-3">
                      {alerts.length === 0 ? (
                        <div className="rounded-[18px] border border-dashed border-[#D7DEE7] bg-[#F8FAFC] px-4 py-5 text-sm text-[#64748B]">
                          Nenhum alerta documental ou operacional relevante no momento.
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {alerts.map((alert) => (
                            <Link
                              key={alert.id}
                              href={getAlertHref(alert)}
                              className="rounded-[18px] border border-[#E2E8F0] bg-[#FCFDFE] px-4 py-3 text-left transition-colors hover:border-[#BFDBFE] hover:bg-[#F8FBFF]"
                              onClick={() => setIsPanelOpen(false)}
                            >
                              <div className="flex items-start gap-3">
                                <span
                                  className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-white ${getAlertIconTone(
                                    alert.severity,
                                  )}`}
                                >
                                  <AlertIcon />
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-semibold text-[#163559]">
                                      {alert.title}
                                    </p>
                                    <span className="inline-flex rounded-full bg-[#EEF4FB] px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#35577E]">
                                      {getAlertKindLabel(alert)}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-xs text-[#64748B]">
                                    {getAlertSubtitle(alert)}
                                  </p>
                                  <p className="mt-2 text-xs font-medium text-[#C2410C]">
                                    {formatDateTime(alert.createdAt)}
                                  </p>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="border-t border-[#E2E8F0] px-4 py-3">
                      <Link
                        href="/documentos"
                        className="inline-flex min-h-11 w-full items-center justify-center rounded-[16px] bg-[#22C55E] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#16A34A]"
                        onClick={() => setIsPanelOpen(false)}
                      >
                        Abrir gestão documental
                      </Link>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E8F0] pt-4">
              <Link href="/documentos" className="df-button-secondary">
                Abrir documentos
              </Link>

              <div className="flex min-w-0 items-center gap-3 rounded-full border border-[#E2E8F0] bg-white py-2 pl-2 pr-3 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#1E3A5F] text-sm font-semibold text-white">
                  {getUserInitials(user.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#163559]">
                    {user.name}
                  </p>
                  <p className="truncate text-xs text-[#64748B]">{user.role}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function buildOperationalHeadline(summary: DashboardOperationalSummary) {
  if (summary.expiredDocuments > 0) {
    return `${summary.expiredDocuments} documento(s) vencido(s) exigem ação imediata.`;
  }

  if (summary.attentionDocuments > 0) {
    return `${summary.attentionDocuments} documento(s) exigem atenção nos próximos dias.`;
  }

  return "A base documental está regular no período atual.";
}

function buildOperationalSupport(summary: DashboardOperationalSummary) {
  if (summary.alertCount > 0) {
    return `${summary.alertCount} alerta(s) relevante(s) seguem monitorados para a rotina operacional.`;
  }

  return `${summary.totalAssociates} associado(s) seguem acompanhados na base atual.`;
}

function buildSummaryChips(summary: DashboardOperationalSummary) {
  return [
    {
      label: `${summary.totalDocuments} documentos monitorados`,
      tone: "neutral" as const,
    },
    {
      label:
        summary.attentionDocuments > 0
          ? `${summary.attentionDocuments} próximos do vencimento`
          : "Sem vencimentos próximos",
      tone: summary.attentionDocuments > 0 ? ("warning" as const) : ("success" as const),
    },
    {
      label:
        summary.expiredDocuments > 0
          ? `${summary.expiredDocuments} vencidos`
          : "Sem pendências vencidas",
      tone: summary.expiredDocuments > 0 ? ("danger" as const) : ("success" as const),
    },
    {
      label: `${summary.totalAssociates} associados acompanhados`,
      tone: "neutral" as const,
    },
  ];
}

function OperationalChip({
  label,
  tone,
}: {
  label: string;
  tone: "neutral" | "warning" | "danger" | "success";
}) {
  const palette =
    tone === "danger"
      ? "border-[#FECACA] bg-[#FFF1F2] text-[#B91C1C]"
      : tone === "warning"
        ? "border-[#FDE68A] bg-[#FFF7D6] text-[#B45309]"
        : tone === "success"
          ? "border-[#BBF7D0] bg-[#ECFDF3] text-[#15803D]"
          : "border-[#D7DEE7] bg-white text-[#35577E]";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold tracking-[0.04em] ${palette}`}
    >
      {label}
    </span>
  );
}

function getUserInitials(name: string) {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "DF";
}

function getAlertHref(alert: OperationalAlert) {
  if (alert.kind === "document_expiration") {
    return "/documentos";
  }

  return "/dashboard#alertas-criticos";
}

function getAlertSubtitle(alert: OperationalAlert) {
  if (alert.kind === "document_expiration") {
    return `${alert.team} - acompanhamento documental`;
  }

  return `${alert.team} - acompanhamento operacional`;
}

function getAlertKindLabel(alert: OperationalAlert) {
  if (alert.kind === "document_expiration") {
    return "Documental";
  }

  if (alert.kind === "operational") {
    return "Operacional";
  }

  return "Manual";
}

function formatDateTime(date: string) {
  const normalized = date.includes("T") ? date : date.replace(" ", "T");

  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "UTC",
    }).format(new Date(normalized));
  } catch {
    return date;
  }
}

function BellIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 17H5.5a1 1 0 0 1-.8-1.6L6 13.7V10a6 6 0 1 1 12 0v3.7l1.3 1.7a1 1 0 0 1-.8 1.6H18" />
      <path d="M9.5 20a2.5 2.5 0 0 0 5 0" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4.5 w-4.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 4 3 20h18L12 4Z" />
      <path d="M12 10v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function getAlertIconTone(severity: OperationalAlert["severity"]) {
  if (severity === "Alta") {
    return "bg-[#EF4444]";
  }

  if (severity === "Media") {
    return "bg-[#FACC15] text-[#6B4F00]";
  }

  return "bg-[#3B82F6]";
}

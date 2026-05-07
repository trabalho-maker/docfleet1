"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { OperationalAlert } from "@/features/data/types";
import {
  formatDateTime,
  getAlertHref,
  getAlertIconTone,
  getAlertKindLabel,
  getAlertSubtitle,
} from "@/features/dashboard/utils/dashboard-alert-view-model";

type DashboardNotificationFabProps = {
  alerts: OperationalAlert[];
  alertCount: number;
};

export function DashboardNotificationFab({
  alerts,
  alertCount,
}: DashboardNotificationFabProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
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
  }, [isOpen]);

  const portalTarget =
    typeof window === "undefined" ? null : window.document.body;

  if (!portalTarget) {
    return null;
  }

  return createPortal(
    <div
      ref={containerRef}
      className="fixed bottom-4 right-4 z-[70] flex items-end justify-end sm:bottom-5 sm:right-5 lg:bottom-6 lg:right-6"
    >
      <div className="relative flex flex-col items-end gap-3">
        {isOpen ? (
          <div
            id={panelId}
            className="w-[min(24rem,calc(100vw-1.5rem))] max-w-sm overflow-hidden rounded-[26px] border border-[#E2E8F0] bg-white shadow-[0_26px_60px_rgba(15,23,42,0.18)]"
          >
            <div className="flex items-start justify-between gap-3 border-b border-[#E2E8F0] px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-[#163559]">
                  Alertas monitorados
                </p>
                <p className="mt-1 text-xs text-[#64748B]">
                  Resumo rápido dos alertas documentais e operacionais mais
                  relevantes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#E2E8F0] bg-white text-[#64748B] transition-colors hover:bg-[#F8FAFC] hover:text-[#163559]"
                aria-label="Fechar notificações"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="max-h-[min(26rem,60vh)] overflow-y-auto px-3 py-3">
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
                      onClick={() => setIsOpen(false)}
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
                onClick={() => setIsOpen(false)}
              >
                Abrir gestão documental
              </Link>
            </div>
          </div>
        ) : null}

        <button
          type="button"
          className="relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#F59E0B] text-white shadow-[0_18px_32px_rgba(245,158,11,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#EA580C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]/40 focus-visible:ring-offset-2"
          aria-label="Abrir notificações"
          aria-controls={panelId}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((current) => !current)}
        >
          <BellIcon />
          {alertCount > 0 ? (
            <span className="absolute right-0 top-0 inline-flex min-h-5 min-w-5 -translate-y-1/4 translate-x-1/4 items-center justify-center rounded-full bg-[#EF4444] px-1 text-[0.65rem] font-semibold text-white">
              {alertCount}
            </span>
          ) : null}
        </button>
      </div>
    </div>,
    portalTarget,
  );
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

function CloseIcon() {
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
      <path d="m6 6 12 12" />
      <path d="M18 6 6 18" />
    </svg>
  );
}

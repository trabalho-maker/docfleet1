import Link from "next/link";
import type { OperationalAlert } from "@/features/data/types";

type DashboardAlertCenterProps = {
  alerts: OperationalAlert[];
  alertCount: number;
};

export function DashboardAlertCenter({
  alerts,
  alertCount,
}: DashboardAlertCenterProps) {
  const [featuredAlert, ...remainingAlerts] = alerts;

  return (
    <article
      id="alertas-criticos"
      className="df-section-card flex h-full flex-col p-5 lg:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[1.4rem] font-semibold tracking-tight text-[#163559]">
            Alertas Críticos
          </h2>
        </div>
        <span className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full bg-[#EF4444] px-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(239,68,68,0.18)]">
          {alertCount}
        </span>
      </div>

      {featuredAlert ? (
        <div className="mt-5 rounded-[24px] border border-[#FECACA] bg-[#FFF7F7] p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={buildSeverityBadgeClassName(featuredAlert.severity)}>
              {featuredAlert.severity}
            </span>
            <span className="inline-flex rounded-full bg-[#EEF4FB] px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#35577E]">
              {getAlertKindLabel(featuredAlert)}
            </span>
          </div>

          <p className="mt-4 text-lg font-semibold tracking-tight text-[#163559]">
            {featuredAlert.title}
          </p>
          <p className="mt-2 text-sm leading-6 text-[#64748B]">
            {getAlertSubtitle(featuredAlert)}
          </p>
          <p className="mt-3 text-sm font-medium text-[#B91C1C]">
            {formatDateTime(featuredAlert.createdAt)}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={getAlertHref(featuredAlert)} className="df-button-primary">
              Abrir gestão documental
            </Link>
            <Link href="/documentos" className="df-button-secondary">
              Ver todos os documentos
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-[24px] border border-dashed border-[#D7DEE7] bg-[#F8FAFC] px-5 py-10 text-sm leading-6 text-[#64748B]">
          Nenhum alerta documental ou operacional relevante no momento. A operação está regular no período atual.
        </div>
      )}

      {remainingAlerts.length > 0 ? (
        <div className="mt-5 flex flex-col gap-3">
          {remainingAlerts.map((alert) => (
            <Link
              key={alert.id}
              href={getAlertHref(alert)}
              className="rounded-[20px] border border-[#E2E8F0] bg-white px-4 py-4 transition-colors hover:border-[#BFDBFE] hover:bg-[#F8FBFF]"
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white ${getAlertIconTone(
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
                    <span className="inline-flex rounded-full bg-[#F8FAFC] px-2 py-0.5 text-[0.68rem] font-semibold text-[#64748B]">
                      {getAlertKindLabel(alert)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[#64748B]">
                    {getAlertSubtitle(alert)}
                  </p>
                  <p className="mt-2 text-xs font-medium text-[#C2410C]">
                    {formatDateTime(alert.createdAt)}
                  </p>
                </div>
                <ChevronIcon />
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function buildSeverityBadgeClassName(severity: OperationalAlert["severity"]) {
  if (severity === "Alta") {
    return "inline-flex rounded-full bg-[#FEE2E2] px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#B91C1C]";
  }

  if (severity === "Media") {
    return "inline-flex rounded-full bg-[#FEF3C7] px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#B45309]";
  }

  return "inline-flex rounded-full bg-[#DBEAFE] px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#1D4ED8]";
}

function getAlertHref(alert: OperationalAlert) {
  if (alert.kind === "document_expiration") {
    return "/documentos";
  }

  return "/dashboard#alertas-criticos";
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

function getAlertSubtitle(alert: OperationalAlert) {
  if (alert.kind === "document_expiration") {
    return `${alert.team} - acompanhamento documental`;
  }

  return `${alert.team} - acompanhamento operacional`;
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

function AlertIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
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

function ChevronIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="mt-0.5 h-5 w-5 shrink-0 text-[#94A3B8]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

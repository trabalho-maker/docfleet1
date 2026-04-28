import Link from "next/link";
import type { FleetDocument } from "@/features/data/types";
import { getDocumentTypeLabel } from "@/features/documents/constants";
import { getDaysUntilDocumentDueDate } from "@/features/documents/lib/expiration";
import { AppShell } from "@/features/dashboard/components/app-shell";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import type {
  DashboardDocumentsByTypeItem,
  DashboardKpi,
  DashboardOverview,
  DashboardTimelinePoint,
} from "@/features/dashboard/types";

type DashboardShellProps = {
  overview: DashboardOverview;
};

export function DashboardShell({ overview }: DashboardShellProps) {
  return (
    <AppShell user={overview.user}>
      <div className="flex min-h-full flex-col gap-6">
        <DashboardHeader
          user={overview.user}
          title={overview.title}
          description={overview.description}
          alertCount={overview.alertCount}
          alerts={overview.alerts}
        />

        <section className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
          {overview.kpis.map((kpi) => (
            <KpiCard key={kpi.label} kpi={kpi} />
          ))}
        </section>

        <section className="grid gap-6 2xl:grid-cols-[1.05fr_0.95fr]">
          <article className="df-section-card p-5 lg:p-6 xl:p-7">
            <SectionHeading
              title="Documentos por Tipo"
              description="Leitura por tipo e status usando os dados reais da base documental."
            />
            <DocumentsByTypeChart items={overview.documentsByType} />
          </article>

          <article className="df-section-card p-5 lg:p-6 xl:p-7">
            <SectionHeading
              title="Vencimentos ao Longo do Tempo"
              description="Distribuicao mensal dos vencimentos no horizonte operacional atual."
            />
            <ExpirationTimelineChart points={overview.expirationTimeline} />
          </article>
        </section>

        <section className="grid gap-6 2xl:grid-cols-[1.3fr_0.7fr]">
          <article className="df-section-card overflow-hidden">
            <div className="flex flex-col gap-4 border-b border-[#E2E8F0] px-6 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-7">
              <div>
                <p className="text-[1.15rem] font-semibold tracking-tight text-[#163559]">
                  PRÓXIMOS VENCIMENTOS
                </p>
                <p className="mt-1 text-sm text-[#64748B]">
                  Documentos com vencimento mais proximo e leitura rapida de status.
                </p>
              </div>
              <Link href="/documentos" className="df-button-secondary">
                Ver todos
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left">
                <thead className="bg-[#F8FAFC] text-sm text-[#475569]">
                  <tr>
                    {[
                      "Documento",
                      "Tipo de Documento",
                      "Data de Validade",
                      "Responsavel",
                      "Status",
                      "Acoes",
                    ].map((column) => (
                      <th
                        key={column}
                        className="px-6 py-4 font-semibold lg:px-7"
                        scope="col"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {overview.recentDocuments.map((document) => (
                    <tr
                      key={document.id}
                      className="border-t border-[#E2E8F0] bg-white text-sm text-[#1E293B] transition-colors hover:bg-[#FBFDFF]"
                    >
                      <td className="px-6 py-4 font-medium lg:px-7">
                        {document.name}
                      </td>
                      <td className="px-6 py-4 text-[#475569] lg:px-7">
                        {getDocumentTypeLabel(document.documentType)}
                      </td>
                      <td className="px-6 py-4 text-[#475569] lg:px-7">
                        {formatDate(document.dueDate)}
                      </td>
                      <td className="px-6 py-4 text-[#475569] lg:px-7">
                        {document.owner}
                      </td>
                      <td className="px-6 py-4 lg:px-7">
                        <DocumentStatusPill document={document} />
                      </td>
                      <td className="px-6 py-4 lg:px-7">
                        <div className="flex items-center gap-2">
                          <Link
                            href="/documentos"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#D7DEE7] bg-white text-[#475569] transition-colors hover:border-[#FDBA74] hover:bg-[#FFF7ED] hover:text-[#C2410C]"
                            aria-label={`Abrir gestao de ${document.name}`}
                          >
                            <EditIcon />
                          </Link>
                          <span
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#D7DEE7] bg-[#F8FAFC] text-[#94A3B8]"
                            aria-hidden="true"
                          >
                            <MessageIcon />
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article
            id="alertas-criticos"
            className="df-section-card flex h-full flex-col p-6 lg:p-7"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[1.15rem] font-semibold tracking-tight text-[#163559]">
                  Alertas Criticos
                </p>
                <p className="mt-1 text-sm text-[#64748B]">
                  Amostra dos alertas documentais e operacionais mais relevantes no momento.
                </p>
              </div>
              <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-[#F87171] px-2 text-sm font-semibold text-white">
                {overview.alertCount}
              </span>
            </div>

            <div className="mt-5 flex flex-1 flex-col gap-4">
              {overview.alerts.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-[#D7DEE7] bg-[#F8FAFC] px-5 py-6 text-sm text-[#64748B]">
                  Nao ha alertas documentais ou operacionais relevantes no momento.
                </div>
              ) : (
                overview.alerts.map((alert) => (
                  <Link
                    key={alert.id}
                    href={getAlertHref(alert)}
                    className={`rounded-[24px] border px-4 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)] ${getAlertCardTone(
                      alert.severity,
                    )} block transition-colors hover:border-[#BFDBFE] hover:bg-[#F8FBFF]`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white ${getAlertIconTone(
                          alert.severity,
                        )}`}
                      >
                        <AlertIcon />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-semibold text-[#163559]">
                          {alert.title}
                        </p>
                        <p className="mt-1 text-sm text-[#64748B]">
                          {getAlertSubtitle(alert)}
                        </p>
                        <p className="mt-2 text-sm font-medium text-[#C2410C]">
                          {formatDateTime(alert.createdAt)}
                        </p>
                      </div>
                      <ChevronIcon />
                    </div>
                  </Link>
                ))
              )}
            </div>

            <Link
              href="/documentos"
              className="mt-5 inline-flex min-h-12 items-center justify-center rounded-[18px] bg-[#22C55E] px-5 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(34,197,94,0.24)] transition-colors hover:bg-[#16A34A]"
            >
              Abrir gestao documental
            </Link>
          </article>
        </section>

        <div className="pointer-events-none fixed bottom-6 right-6 z-20 hidden flex-col gap-3 2xl:flex">
          <a
            href="#alertas-criticos"
            className="pointer-events-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#35577E] text-white shadow-[0_18px_32px_rgba(15,23,42,0.2)] transition-transform hover:-translate-y-0.5"
            aria-label="Ir para alertas criticos"
          >
            <BellFloatingIcon />
          </a>
          <Link
            href="/documentos"
            className="pointer-events-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#F59E0B] text-white shadow-[0_18px_32px_rgba(245,158,11,0.28)] transition-transform hover:-translate-y-0.5"
            aria-label="Abrir documentos"
          >
            <PlusIcon />
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-[1.15rem] font-semibold tracking-tight text-[#163559]">
        {title}
      </h2>
      <p className="mt-1 text-sm text-[#64748B]">{description}</p>
    </div>
  );
}

function KpiCard({ kpi }: { kpi: DashboardKpi }) {
  const tone = getKpiTone(kpi.tone);

  return (
    <article
      className={`rounded-[28px] border bg-white px-5 py-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)] transition-transform hover:-translate-y-0.5 sm:px-6 sm:py-6 ${tone.border}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#475569]">{kpi.label}</p>
          <p className="mt-3 text-4xl font-semibold tracking-tight text-[#163559] sm:text-5xl">
            {kpi.value}
          </p>
          <p className={`mt-3 text-sm ${tone.helper}`}>{kpi.helper}</p>
        </div>
        <span
          className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tone.iconBg}`}
        >
          <KpiIcon icon={kpi.icon} className={tone.iconText} />
        </span>
      </div>
    </article>
  );
}

function DocumentsByTypeChart({
  items,
}: {
  items: DashboardDocumentsByTypeItem[];
}) {
  if (items.length === 0) {
    return (
      <div className="mt-6 rounded-[24px] border border-dashed border-[#D7DEE7] bg-[#F8FAFC] px-5 py-10 text-sm text-[#64748B]">
        Nao ha dados suficientes para montar o grafico por tipo.
      </div>
    );
  }

  const maxValue = Math.max(
    1,
    ...items.flatMap((item) => [item.expired, item.attention, item.valid]),
  );
  const chartHeight = 260;
  const gridLines = 4;

  return (
    <div className="mt-6">
      <div className="grid min-h-[300px] grid-cols-[34px_minmax(0,1fr)] gap-3 sm:grid-cols-[42px_minmax(0,1fr)] sm:gap-4">
        <div className="flex flex-col justify-between pb-10 pt-2 text-[0.7rem] text-[#94A3B8] sm:text-xs">
          {Array.from({ length: gridLines + 1 }, (_, index) => {
            const value = Math.round((maxValue / gridLines) * (gridLines - index));
            return <span key={index}>{value}</span>;
          })}
        </div>

        <div className="relative">
          <div className="absolute inset-0 grid grid-rows-4 border-b border-l border-[#E2E8F0]">
            {Array.from({ length: gridLines }, (_, index) => (
              <div
                key={index}
                className="border-t border-dashed border-[#E2E8F0]"
              />
            ))}
          </div>

          <div className="relative flex h-full items-end justify-between gap-3 pb-10 pl-2 pr-1 sm:gap-4 sm:pl-4 sm:pr-2">
            {items.map((item) => (
              <div
                key={item.type}
                className="flex min-w-0 flex-1 flex-col items-center gap-3 sm:gap-4"
              >
                <div
                  className="flex h-[220px] items-end gap-1.5 sm:h-[260px] sm:gap-2"
                  style={{ height: `${chartHeight}px` }}
                >
                  <Bar
                    color="bg-[#F87171]"
                    value={item.expired}
                    maxValue={maxValue}
                    chartHeight={chartHeight}
                  />
                  <Bar
                    color="bg-[#FACC15]"
                    value={item.attention}
                    maxValue={maxValue}
                    chartHeight={chartHeight}
                  />
                  <Bar
                    color="bg-[#22C55E]"
                    value={item.valid}
                    maxValue={maxValue}
                    chartHeight={chartHeight}
                  />
                </div>
                <p className="line-clamp-2 min-h-10 text-center text-xs font-medium text-[#475569] sm:text-sm">
                  {item.type}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-6 text-sm text-[#475569]">
        <Legend tone="bg-[#F87171]" label="Vencidos" />
        <Legend tone="bg-[#FACC15]" label="Atencao" />
        <Legend tone="bg-[#22C55E]" label="Em dia" />
      </div>
    </div>
  );
}

function Bar({
  color,
  value,
  maxValue,
  chartHeight,
}: {
  color: string;
  value: number;
  maxValue: number;
  chartHeight: number;
}) {
  const height = Math.max((value / maxValue) * chartHeight, value > 0 ? 12 : 0);

  return (
    <div
      className={`w-4 rounded-t-full ${color} shadow-[0_8px_18px_rgba(15,23,42,0.08)] sm:w-6`}
      style={{ height: `${height}px` }}
      aria-hidden="true"
      title={String(value)}
    />
  );
}

function ExpirationTimelineChart({
  points,
}: {
  points: DashboardTimelinePoint[];
}) {
  if (points.length === 0) {
    return (
      <div className="mt-6 rounded-[24px] border border-dashed border-[#D7DEE7] bg-[#F8FAFC] px-5 py-10 text-sm text-[#64748B]">
        Nao ha dados suficientes para montar a linha temporal.
      </div>
    );
  }

  const width = 640;
  const height = 260;
  const padding = 28;
  const maxValue = Math.max(1, ...points.map((point) => point.total));
  const linePath = buildLinePath(points, width, height, padding, maxValue);
  const areaPath = buildAreaPath(points, width, height, padding, maxValue);

  return (
    <div className="mt-6">
      <div className="overflow-hidden rounded-[26px] border border-[#E2E8F0] bg-[linear-gradient(180deg,#FCFDFE_0%,#FFFFFF_100%)] p-3 sm:p-4">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[240px] w-full sm:h-[280px]"
          role="img"
          aria-label="Vencimentos ao longo do tempo"
        >
          <defs>
            <linearGradient id="df-expiration-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#35577E" stopOpacity="0.42" />
              <stop offset="100%" stopColor="#35577E" stopOpacity="0.08" />
            </linearGradient>
          </defs>

          {Array.from({ length: 4 }, (_, index) => {
            const y = padding + ((height - padding * 2) / 4) * index;
            return (
              <line
                key={index}
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#DCE5EF"
                strokeDasharray="4 6"
              />
            );
          })}

          {points.map((point, index) => {
            const x = getChartX(index, points.length, width, padding);
            return (
              <line
                key={point.label}
                x1={x}
                y1={padding}
                x2={x}
                y2={height - padding}
                stroke="#E7EDF4"
                strokeDasharray="4 8"
              />
            );
          })}

          <path d={areaPath} fill="url(#df-expiration-area)" />
          <path
            d={linePath}
            fill="none"
            stroke="#35577E"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((point, index) => {
            const x = getChartX(index, points.length, width, padding);
            const y = getChartY(point.total, height, padding, maxValue);

            return (
              <circle
                key={point.label}
                cx={x}
                cy={y}
                r="4.5"
                fill="#35577E"
                stroke="#FFFFFF"
                strokeWidth="2"
              />
            );
          })}
        </svg>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs text-[#64748B] sm:text-sm">
        {points.map((point) => (
          <div key={point.label}>
            <p>{point.label}</p>
            <p className="mt-1 text-xs font-semibold text-[#163559]">{point.total}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Legend({ tone, label }: { tone: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-3.5 w-3.5 rounded-full ${tone}`} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

function DocumentStatusPill({ document }: { document: FleetDocument }) {
  const daysUntilDue = getDaysUntilDocumentDueDate(document.dueDate);

  if (document.status === "Vencido") {
    const days = Math.abs(daysUntilDue ?? 0);
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-[#FEE2E2] px-3 py-1 text-xs font-semibold text-[#DC2626]">
        <AlertTriangleIcon />
        Vencido ({days}d)
      </span>
    );
  }

  if (document.status === "Atencao") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-[#FEF3C7] px-3 py-1 text-xs font-semibold text-[#D97706]">
        <ClockStatusIcon />
        Atencao ({Math.max(daysUntilDue ?? 0, 0)}d)
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-semibold text-[#16A34A]">
      <CheckCircleIcon />
      Em dia
    </span>
  );
}

function getKpiTone(tone: DashboardKpi["tone"]) {
  if (tone === "warning") {
    return {
      border: "border-[#FDE68A]",
      iconBg: "bg-[#FEF3C7]",
      iconText: "text-[#F59E0B]",
      helper: "text-[#D97706]",
    };
  }

  if (tone === "danger") {
    return {
      border: "border-[#FCA5A5]",
      iconBg: "bg-[#FEE2E2]",
      iconText: "text-[#EF4444]",
      helper: "text-[#DC2626]",
    };
  }

  if (tone === "success") {
    return {
      border: "border-[#BBF7D0]",
      iconBg: "bg-[#DCFCE7]",
      iconText: "text-[#22C55E]",
      helper: "text-[#15803D]",
    };
  }

  return {
    border: "border-[#DBEAFE]",
    iconBg: "bg-[#EAF2FB]",
    iconText: "text-[#35577E]",
    helper: "text-[#64748B]",
  };
}

function KpiIcon({
  icon,
  className,
}: {
  icon: DashboardKpi["icon"];
  className: string;
}) {
  if (icon === "attention") {
    return <ClockStatusIcon className={className} />;
  }

  if (icon === "expired") {
    return <AlertTriangleIcon className={className} />;
  }

  if (icon === "associates") {
    return <AssociatesIcon className={className} />;
  }

  return <DocumentsIcon className={className} />;
}

function getAlertCardTone(severity: DashboardOverview["alerts"][number]["severity"]) {
  if (severity === "Alta") {
    return "border-[#FECACA] bg-[#FFF5F5]";
  }

  if (severity === "Media") {
    return "border-[#FDE68A] bg-[#FFFBEA]";
  }

  return "border-[#BFDBFE] bg-[#F5F9FF]";
}

function getAlertHref(alert: DashboardOverview["alerts"][number]) {
  if (alert.kind === "document_expiration") {
    return "/documentos";
  }

  return "/dashboard#alertas-criticos";
}

function getAlertSubtitle(alert: DashboardOverview["alerts"][number]) {
  if (alert.kind === "document_expiration") {
    return `${alert.team} - acompanhamento documental`;
  }

  return `${alert.team} - acompanhamento operacional`;
}

function getAlertIconTone(severity: DashboardOverview["alerts"][number]["severity"]) {
  if (severity === "Alta") {
    return "bg-[#EF4444]";
  }

  if (severity === "Media") {
    return "bg-[#FACC15] text-[#6B4F00]";
  }

  return "bg-[#3B82F6]";
}

function getChartX(
  index: number,
  total: number,
  width: number,
  padding: number,
) {
  if (total <= 1) {
    return width / 2;
  }

  return padding + ((width - padding * 2) / (total - 1)) * index;
}

function getChartY(
  value: number,
  height: number,
  padding: number,
  maxValue: number,
) {
  const usableHeight = height - padding * 2;
  return height - padding - (value / maxValue) * usableHeight;
}

function buildLinePath(
  points: DashboardTimelinePoint[],
  width: number,
  height: number,
  padding: number,
  maxValue: number,
) {
  return points
    .map((point, index) => {
      const x = getChartX(index, points.length, width, padding);
      const y = getChartY(point.total, height, padding, maxValue);
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

function buildAreaPath(
  points: DashboardTimelinePoint[],
  width: number,
  height: number,
  padding: number,
  maxValue: number,
) {
  const linePath = buildLinePath(points, width, height, padding, maxValue);
  const lastX = getChartX(points.length - 1, points.length, width, padding);
  const firstX = getChartX(0, points.length, width, padding);
  const baseline = height - padding;

  return `${linePath} L ${lastX} ${baseline} L ${firstX} ${baseline} Z`;
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

function DocumentsIcon({ className }: { className: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`h-6 w-6 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2v-13a2.5 2.5 0 0 1 2-2.5Z" />
      <path d="M14 3.5V8h4" />
      <path d="M9 12h6M9 16h6" />
    </svg>
  );
}

function ClockStatusIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function AlertTriangleIcon({
  className = "h-4 w-4",
}: {
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
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

function AssociatesIcon({ className }: { className: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`h-6 w-6 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 19a4 4 0 0 0-8 0" />
      <circle cx="12" cy="9" r="3.2" />
      <path d="M20 18a3.2 3.2 0 0 0-2.3-3.1" />
      <path d="M6.3 14.9A3.2 3.2 0 0 0 4 18" />
    </svg>
  );
}

function CheckCircleIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.2 2.2L15.5 9.5" />
    </svg>
  );
}

function EditIcon() {
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
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </svg>
  );
}

function MessageIcon() {
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
      <path d="M20 11.5a7.5 7.5 0 0 1-11.5 6.3L4 19l1.3-4.1A7.5 7.5 0 1 1 20 11.5Z" />
    </svg>
  );
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
      className="mt-1 h-5 w-5 shrink-0 text-[#94A3B8]"
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

function BellFloatingIcon() {
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
      <path d="M15 17H5.5a1 1 0 0 1-.8-1.6L6 13.7V10a6 6 0 1 1 12 0v3.7l1.3 1.7a1 1 0 0 1-.8 1.6H18" />
      <path d="M9.5 20a2.5 2.5 0 0 0 5 0" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

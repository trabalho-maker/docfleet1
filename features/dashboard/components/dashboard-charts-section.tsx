import type {
  DashboardDocumentsByTypeItem,
  DashboardTimelinePoint,
} from "@/features/dashboard/types";

type DashboardChartsSectionProps = {
  documentsByType: DashboardDocumentsByTypeItem[];
  expirationTimeline: DashboardTimelinePoint[];
};

export function DashboardChartsSection({
  documentsByType,
  expirationTimeline,
}: DashboardChartsSectionProps) {
  const dominantType = getDominantDocumentType(documentsByType);
  const timelinePeak = getTimelinePeak(expirationTimeline);

  return (
    <section className="grid gap-5 2xl:grid-cols-[1.05fr_0.95fr]">
      <article className="df-section-card p-5 lg:p-6">
        <SectionHeading
          eyebrow="Leitura por tipo"
          title="Documentos por Tipo"
          description="Distribuição real dos documentos por tipo e status na base monitorada."
          insight={
            dominantType
              ? `${dominantType.type} concentra o maior volume monitorado no momento.`
              : "Sem dados suficientes para distribuição por tipo."
          }
        />
        <DocumentsByTypeChart items={documentsByType} />
      </article>

      <article className="df-section-card p-5 lg:p-6">
        <SectionHeading
          eyebrow="Linha temporal"
          title="Vencimentos ao Longo do Tempo"
          description="Janela mensal dos vencimentos no horizonte operacional atual."
          insight={
            timelinePeak
              ? `${timelinePeak.label} concentra o maior volume no período analisado.`
              : "Sem vencimentos registrados no recorte atual."
          }
        />
        <ExpirationTimelineChart points={expirationTimeline} />
      </article>
    </section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  insight,
}: {
  eyebrow: string;
  title: string;
  description: string;
  insight: string;
}) {
  return (
    <div>
      <p className="df-eyebrow">{eyebrow}</p>
      <h2 className="mt-2 text-[1.25rem] font-semibold tracking-tight text-[#163559]">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-[#64748B]">{description}</p>
      <p className="mt-3 inline-flex rounded-full bg-[#F8FAFC] px-3 py-1.5 text-xs font-semibold text-[#35577E]">
        {insight}
      </p>
    </div>
  );
}

function DocumentsByTypeChart({
  items,
}: {
  items: DashboardDocumentsByTypeItem[];
}) {
  if (items.length === 0) {
    return (
      <div className="mt-5 rounded-[24px] border border-dashed border-[#D7DEE7] bg-[#F8FAFC] px-5 py-8 text-sm leading-6 text-[#64748B]">
        Não há dados suficientes para montar a distribuição por tipo.
      </div>
    );
  }

  const maxValue = Math.max(
    1,
    ...items.flatMap((item) => [item.expired, item.attention, item.valid]),
  );
  const chartHeight = 208;
  const gridLines = 4;

  return (
    <div className="mt-5">
      <div className="grid min-h-[248px] grid-cols-[32px_minmax(0,1fr)] gap-3 sm:grid-cols-[40px_minmax(0,1fr)] sm:gap-4">
        <div className="flex flex-col justify-between pb-10 pt-2 text-[0.68rem] text-[#94A3B8] sm:text-xs">
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

          <div className="relative flex h-full items-end justify-between gap-3 pb-10 pl-2 pr-1 sm:gap-4 sm:pl-3 sm:pr-2">
            {items.map((item) => (
              <div
                key={item.type}
                className="flex min-w-0 flex-1 flex-col items-center gap-3"
              >
                <div
                  className="flex h-[208px] items-end gap-1.5 sm:gap-2"
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

      <div className="mt-3 flex flex-wrap items-center justify-center gap-5 text-sm text-[#475569]">
        <Legend tone="bg-[#F87171]" label="Vencidos" />
        <Legend tone="bg-[#FACC15]" label="Atenção" />
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
  const height = Math.max((value / maxValue) * chartHeight, value > 0 ? 10 : 0);

  return (
    <div
      className={`w-4 rounded-t-full ${color} shadow-[0_8px_18px_rgba(15,23,42,0.08)] sm:w-5`}
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
      <div className="mt-5 rounded-[24px] border border-dashed border-[#D7DEE7] bg-[#F8FAFC] px-5 py-8 text-sm leading-6 text-[#64748B]">
        Não há dados suficientes para montar a linha temporal.
      </div>
    );
  }

  const width = 640;
  const height = 220;
  const padding = 24;
  const maxValue = Math.max(1, ...points.map((point) => point.total));
  const linePath = buildLinePath(points, width, height, padding, maxValue);
  const areaPath = buildAreaPath(points, width, height, padding, maxValue);

  return (
    <div className="mt-5">
      <div className="overflow-hidden rounded-[24px] border border-[#E2E8F0] bg-[linear-gradient(180deg,#FCFDFE_0%,#FFFFFF_100%)] p-3 sm:p-4">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[220px] w-full sm:h-[240px]"
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

      <div className="mt-3 grid grid-cols-7 gap-2 text-center text-xs text-[#64748B] sm:text-sm">
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

function getDominantDocumentType(items: DashboardDocumentsByTypeItem[]) {
  return items
    .map((item) => ({
      type: item.type,
      total: item.valid + item.attention + item.expired,
    }))
    .sort((left, right) => right.total - left.total)[0] ?? null;
}

function getTimelinePeak(points: DashboardTimelinePoint[]) {
  return [...points].sort((left, right) => right.total - left.total)[0] ?? null;
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

import Link from "next/link";
import type {
  AssociateProfileCategory,
} from "@/features/associates/types";
import { AssociatesPageHeader } from "@/features/associates/components/associates-page-header";
import type {
  MembershipFeeOverview,
  MembershipFeeOverviewStatusFilter,
} from "@/features/membership-fees/types";

type MembershipFeesOverviewSectionProps = {
  overview: MembershipFeeOverview;
  filters: {
    search: string;
    category: AssociateProfileCategory | "";
    status: MembershipFeeOverviewStatusFilter;
  };
  userName: string;
  userEmail: string;
  userRole: string;
};

const statusCards: Array<{
  key: Exclude<MembershipFeeOverviewStatusFilter, "all" | "up_to_date">;
  label: string;
}> = [
  {
    key: "one_overdue",
    label: "1 mês vencido",
  },
  {
    key: "two_overdue",
    label: "2 meses vencidos",
  },
  {
    key: "three_plus_overdue",
    label: "3+ meses vencidos",
  },
];

export function MembershipFeesOverviewSection({
  overview,
  filters,
  userName,
  userEmail,
  userRole,
}: MembershipFeesOverviewSectionProps) {
  return (
    <div className="flex w-full flex-1 flex-col gap-6 py-2 sm:py-4">
      <AssociatesPageHeader
        eyebrow="Associados > Mensalidades"
        title="Mensalidades"
        userName={userName}
        userEmail={userEmail}
        userRole={userRole}
        action={
          <div className="flex flex-wrap gap-3">
            <Link href="/associados" className="df-button-secondary">
              Base de associados
            </Link>
          </div>
        }
      />

      <section className="grid gap-5 xl:grid-cols-3">
        {statusCards.map((card) => {
          const count =
            card.key === "one_overdue"
              ? overview.counts.oneOverdue
              : card.key === "two_overdue"
                ? overview.counts.twoOverdue
                : overview.counts.threePlusOverdue;
          const href = buildOverviewHref(filters, {
            status: card.key,
          });
          const palette = getStatusCardPalette(card.key);
          const isActive = filters.status === card.key;

          return (
            <Link
              key={card.key}
              href={href}
              className={`group relative overflow-hidden rounded-[30px] border p-6 transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_50px_rgba(15,23,42,0.10)] ${palette.wrapper} ${
                isActive ? palette.activeRing : ""
              }`}
            >
              <div className={`absolute inset-x-0 top-0 h-1.5 ${palette.bar}`} aria-hidden="true" />
              <div className="relative space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                  {card.label}
                </p>
                <p className="text-4xl font-semibold tracking-tight text-[var(--color-foreground)]">
                  {count}
                </p>
              </div>
            </Link>
          );
        })}
      </section>

      <section className="df-section-card p-6 lg:p-7">
        <div className="flex flex-col gap-2 border-b border-[var(--color-border)] pb-5">
          <h2 className="text-[1.4rem] font-semibold tracking-tight text-[var(--color-foreground)]">
            Filtros
          </h2>
        </div>

        <form action="/associados/mensalidades" method="get" className="mt-6 grid gap-4 xl:grid-cols-[1.4fr_0.8fr_0.9fr_auto]">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-[var(--color-foreground)]">
              Buscar por nome
            </span>
            <input
              type="search"
              name="search"
              defaultValue={filters.search}
              placeholder="Digite o nome do associado"
              className="min-h-12 rounded-2xl border border-[var(--color-border)] bg-white px-4 text-sm text-[var(--color-foreground)] outline-none transition-colors placeholder:text-slate-400 focus:border-[#1D4ED8]"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-[var(--color-foreground)]">
              Categoria
            </span>
            <select
              name="category"
              defaultValue={filters.category}
              className="min-h-12 rounded-2xl border border-[var(--color-border)] bg-white px-4 text-sm text-[var(--color-foreground)] outline-none transition-colors focus:border-[#1D4ED8]"
            >
              <option value="">Todas</option>
              <option value="TAXI">Táxi</option>
              <option value="ESCOLAR">Escolar</option>
              <option value="CAMINHAO">Caminhão</option>
              <option value="CNPJ">CNPJ / Empresas</option>
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-[var(--color-foreground)]">
              Tempo / status
            </span>
            <select
              name="status"
              defaultValue={filters.status}
              className="min-h-12 rounded-2xl border border-[var(--color-border)] bg-white px-4 text-sm text-[var(--color-foreground)] outline-none transition-colors focus:border-[#1D4ED8]"
            >
              <option value="all">Todos</option>
              <option value="up_to_date">Em dia</option>
              <option value="one_overdue">1 mês vencido</option>
              <option value="two_overdue">2 meses vencidos</option>
              <option value="three_plus_overdue">3+ meses vencidos</option>
            </select>
          </label>

          <div className="flex items-end gap-3">
            <button type="submit" className="df-button-primary w-auto px-5">
              Aplicar filtros
            </button>
            <Link href="/associados/mensalidades" className="df-button-secondary">
              Limpar
            </Link>
          </div>
        </form>
      </section>

      <section className="df-section-card p-6 lg:p-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-[1.6rem] font-semibold tracking-tight text-[var(--color-foreground)]">
              Associados
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
              {overview.filteredAssociates} associado(s) filtrado(s) de {overview.totalAssociates} na base.
            </p>
          </div>
        </div>

        {overview.entries.length === 0 ? (
          <div className="mt-6 rounded-[24px] border border-dashed border-[var(--color-border)] bg-[#F8FAFC] px-5 py-12 text-center text-sm leading-6 text-[var(--color-muted)]">
            Nenhum associado corresponde aos filtros atuais de mensalidade.
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-[28px] border border-[#E5E7EB] bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E5E7EB]">
                <thead className="bg-[#F8FAFC]">
                  <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#64748B]">
                    <th className="px-5 py-4">Nome</th>
                    <th className="px-5 py-4">Categoria</th>
                    <th className="px-5 py-4">Matrícula</th>
                    <th className="px-5 py-4">Telefone</th>
                    <th className="px-5 py-4">Situação</th>
                    <th className="px-5 py-4">Meses vencidos</th>
                    <th className="px-5 py-4">Último pagamento</th>
                    <th className="px-5 py-4 text-right">Ficha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {overview.entries.map((entry) => (
                    <tr key={entry.associateId} className="align-top transition-colors hover:bg-[#FCFDFE]">
                      <td className="px-5 py-4">
                        <Link
                          href={`/associados/${entry.associateId}/mensalidades`}
                          className="font-semibold text-[#0F172A] transition-colors hover:text-[#1D4ED8]"
                        >
                          {entry.name}
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-sm text-[#64748B]">{entry.categoryLabel}</td>
                      <td className="px-5 py-4 text-sm text-[#64748B]">{entry.registrationNumber}</td>
                      <td className="px-5 py-4 text-sm text-[#64748B]">
                        {entry.phone ?? "Não informado"}
                      </td>
                      <td className="px-5 py-4">
                        <span className={buildStatusBadgeClassName(entry.statusTone)}>
                          {entry.statusLabel}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-[#0F172A]">
                        {entry.overdueMonths}
                      </td>
                      <td className="px-5 py-4 text-sm text-[#64748B]">
                        {entry.lastPaymentAt ? formatLastPayment(entry.lastPaymentAt) : "Sem registro"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end">
                          <Link
                            href={`/associados/${entry.associateId}/mensalidades`}
                            className="df-button-secondary"
                          >
                            Abrir ficha
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function buildOverviewHref(
  filters: {
    search: string;
    category: AssociateProfileCategory | "";
    status: MembershipFeeOverviewStatusFilter;
  },
  overrides: Partial<{
    search: string;
    category: AssociateProfileCategory | "";
    status: MembershipFeeOverviewStatusFilter;
  }>,
) {
  const params = new URLSearchParams();
  const nextSearch = overrides.search ?? filters.search;
  const nextCategory = overrides.category ?? filters.category;
  const nextStatus = overrides.status ?? filters.status;

  if (nextSearch) {
    params.set("search", nextSearch);
  }

  if (nextCategory) {
    params.set("category", nextCategory);
  }

  if (nextStatus && nextStatus !== "all") {
    params.set("status", nextStatus);
  }

  const query = params.toString();
  return query ? `/associados/mensalidades?${query}` : "/associados/mensalidades";
}

function getStatusCardPalette(status: Exclude<MembershipFeeOverviewStatusFilter, "all" | "up_to_date">) {
  switch (status) {
    case "one_overdue":
      return {
        wrapper: "border-amber-200 bg-[linear-gradient(180deg,#FFF7ED_0%,#FFFFFF_100%)]",
        bar: "bg-[#F59E0B]",
        activeRing: "ring-2 ring-[#F59E0B]/35",
      };
    case "two_overdue":
      return {
        wrapper: "border-orange-200 bg-[linear-gradient(180deg,#FFF1E8_0%,#FFFFFF_100%)]",
        bar: "bg-[#F97316]",
        activeRing: "ring-2 ring-[#F97316]/35",
      };
    default:
      return {
        wrapper: "border-red-200 bg-[linear-gradient(180deg,#FEF2F2_0%,#FFFFFF_100%)]",
        bar: "bg-[#DC2626]",
        activeRing: "ring-2 ring-[#DC2626]/35",
      };
  }
}

function buildStatusBadgeClassName(
  tone: "success" | "warning" | "danger",
) {
  if (tone === "danger") {
    return "inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700";
  }

  if (tone === "warning") {
    return "inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700";
  }

  return "inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700";
}

function formatLastPayment(value: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

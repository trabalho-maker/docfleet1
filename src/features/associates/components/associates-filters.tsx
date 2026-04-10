import Link from "next/link";
import { associateCategories, associateStatuses } from "@/src/features/associates/constants";
import type { AssociateCategory, AssociateStatus } from "@/src/features/associates/types";

export type AssociatesFilterValues = {
  search: string;
  cpf: string;
  category: AssociateCategory | "";
  status: AssociateStatus | "";
};

type AssociatesFiltersProps = {
  values: AssociatesFilterValues;
};

export function AssociatesFilters({ values }: AssociatesFiltersProps) {
  const hasActiveFilters = Boolean(
    values.search || values.cpf || values.category || values.status,
  );

  return (
    <section className="rounded-[32px] border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm lg:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Busca e filtros
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--color-foreground)]">
            Refine a listagem
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Combine nome, CPF, categoria e situacao para localizar associados com
            rapidez.
          </p>
        </div>
        {hasActiveFilters ? (
          <Link
            href="/associados"
            className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Limpar filtros
          </Link>
        ) : null}
      </div>

      <form
        action="/associados"
        method="get"
        className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_1fr_0.8fr_0.8fr_auto]"
      >
        <div className="grid gap-2">
          <label
            htmlFor="associate-search"
            className="text-sm font-medium text-[var(--color-foreground)]"
          >
            Buscar por nome
          </label>
          <input
            id="associate-search"
            name="search"
            defaultValue={values.search}
            placeholder="Ex.: Maria Silva"
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-900"
          />
        </div>

        <div className="grid gap-2">
          <label
            htmlFor="associate-cpf"
            className="text-sm font-medium text-[var(--color-foreground)]"
          >
            Buscar por CPF
          </label>
          <input
            id="associate-cpf"
            name="cpf"
            defaultValue={values.cpf}
            placeholder="000.000.000-00"
            inputMode="numeric"
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-900"
          />
        </div>

        <div className="grid gap-2">
          <label
            htmlFor="associate-category"
            className="text-sm font-medium text-[var(--color-foreground)]"
          >
            Categoria
          </label>
          <select
            id="associate-category"
            name="category"
            defaultValue={values.category}
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-colors focus:border-slate-900"
          >
            <option value="">Todas</option>
            {associateCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <label
            htmlFor="associate-status"
            className="text-sm font-medium text-[var(--color-foreground)]"
          >
            Situacao
          </label>
          <select
            id="associate-status"
            name="status"
            defaultValue={values.status}
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-colors focus:border-slate-900"
          >
            <option value="">Todas</option>
            {associateStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#f97316] px-5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(249,115,22,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#ea580c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fdba74] focus-visible:ring-offset-2 xl:w-auto"
          >
            Aplicar filtros
          </button>
        </div>
      </form>
    </section>
  );
}

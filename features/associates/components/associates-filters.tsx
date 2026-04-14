import Link from "next/link";
import { associateCategories, associateStatuses } from "@/features/associates/constants";
import type { AssociateCategory, AssociateStatus } from "@/features/associates/types";

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
    <section className="rounded-[32px] border border-[#E5E7EB] bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.04)] lg:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#64748B]">
            Busca e filtros
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#0F172A]">
            Refine a listagem
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#64748B]">
            Combine nome, CPF, categoria e situação para localizar associados com
            rapidez e manter a operação mais previsível.
          </p>
        </div>
        {hasActiveFilters ? (
          <Link
            href="/associados"
            className="inline-flex h-10 items-center justify-center rounded-full border border-[#E5E7EB] bg-white px-4 text-sm font-semibold text-[#0F172A] transition-colors hover:bg-[#FFF7ED]"
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
        <Field label="Buscar por nome" htmlFor="associate-search">
          <input
            id="associate-search"
            name="search"
            defaultValue={values.search}
            placeholder="Ex.: Maria Silva"
            className={inputClassName}
          />
        </Field>

        <Field label="Buscar por CPF" htmlFor="associate-cpf">
          <input
            id="associate-cpf"
            name="cpf"
            defaultValue={values.cpf}
            placeholder="000.000.000-00"
            inputMode="numeric"
            className={inputClassName}
          />
        </Field>

        <Field label="Categoria" htmlFor="associate-category">
          <select
            id="associate-category"
            name="category"
            defaultValue={values.category}
            className={inputClassName}
          >
            <option value="">Todas</option>
            {associateCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Situação" htmlFor="associate-status">
          <select
            id="associate-status"
            name="status"
            defaultValue={values.status}
            className={inputClassName}
          >
            <option value="">Todas</option>
            {associateStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </Field>

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

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="grid gap-2">
      <span className="text-sm font-medium text-[#0F172A]">{label}</span>
      {children}
    </label>
  );
}

const inputClassName =
  "h-12 rounded-2xl border border-[#E5E7EB] bg-[#FCFDFE] px-4 text-sm text-[#0F172A] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#1E3A5F] focus:bg-white";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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
    <section className="df-section-card p-6 lg:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="df-eyebrow">Busca e filtros</p>
          <h2 className="mt-2 text-[1.8rem] font-semibold tracking-tight text-[var(--color-foreground)]">
            Refine a listagem
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
            Combine nome, CPF, categoria e situação para localizar associados com
            rapidez e manter a operação mais previsível.
          </p>
        </div>
        {hasActiveFilters ? (
          <Link href="/associados" className="df-button-secondary">
            Limpar filtros
          </Link>
        ) : null}
      </div>

      <form
        action="/associados"
        method="get"
        className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_1fr_0.8fr_0.8fr_auto]"
      >
        <Input
          id="associate-search"
          label="Buscar por nome"
          name="search"
          defaultValue={values.search}
          placeholder="Ex.: Maria Silva"
        />

        <Input
          id="associate-cpf"
          label="Buscar por CPF"
          name="cpf"
          defaultValue={values.cpf}
          placeholder="000.000.000-00"
          inputMode="numeric"
        />

        <Select
          id="associate-category"
          label="Categoria"
          name="category"
          defaultValue={values.category}
          options={[
            { value: "", label: "Todas" },
            ...associateCategories.map((category) => ({
              value: category,
              label: category,
            })),
          ]}
        />

        <Select
          id="associate-status"
          label="Situação"
          name="status"
          defaultValue={values.status}
          options={[
            { value: "", label: "Todas" },
            ...associateStatuses.map((status) => ({
              value: status,
              label: status,
            })),
          ]}
        />

        <div className="flex items-end">
          <Button type="submit" className="xl:min-w-[168px]">
            Aplicar filtros
          </Button>
        </div>
      </form>
    </section>
  );
}

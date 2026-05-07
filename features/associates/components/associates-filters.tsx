import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  associateCategories,
  associateProfileCategories,
  associatesDefaults,
  associateStatuses,
} from "@/features/associates/constants";
import type {
  AssociateCategory,
  AssociateProfileCategory,
  AssociateStatus,
} from "@/features/associates/types";

export type AssociatesFilterValues = {
  search: string;
  cpf: string;
  category: AssociateCategory | "";
  modalidadeAssociado: AssociateProfileCategory | "";
  status: AssociateStatus | "";
  page: number;
  pageSize: number;
};

type AssociatesFiltersProps = {
  values: AssociatesFilterValues;
};

export function AssociatesFilters({ values }: AssociatesFiltersProps) {
  const hasActiveFilters = Boolean(
    values.search ||
      values.cpf ||
      values.category ||
      values.modalidadeAssociado ||
      values.status,
  );

  return (
    <section className="df-section-card p-6 lg:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[1.8rem] font-semibold tracking-tight text-[var(--color-foreground)]">
            Filtros
          </h2>
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
        className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_1fr_0.85fr_0.85fr_0.85fr_0.75fr_auto]"
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
          id="associate-modality"
          label="Modalidade"
          name="modalidadeAssociado"
          defaultValue={values.modalidadeAssociado}
          options={[
            { value: "", label: "Todas" },
            ...associateProfileCategories.map((category) => ({
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

        <Select
          id="associate-page-size"
          label="Itens por página"
          name="pageSize"
          defaultValue={String(values.pageSize || associatesDefaults.pageSize)}
          options={[
            { value: "10", label: "10" },
            { value: "20", label: "20" },
            { value: "50", label: "50" },
            { value: "100", label: "100" },
          ]}
        />

        <div className="flex items-end">
          <input type="hidden" name="page" value="1" />
          <Button type="submit" className="xl:min-w-[168px]">
            Aplicar filtros
          </Button>
        </div>
      </form>
    </section>
  );
}

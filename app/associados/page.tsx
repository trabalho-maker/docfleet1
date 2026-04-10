import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/features/auth/server/session";
import {
  AssociatesFilters,
  type AssociatesFilterValues,
} from "@/src/features/associates/components/associates-filters";
import { AssociatesListSection } from "@/src/features/associates/components/associates-list-section";
import { associateCategories, associateStatuses } from "@/src/features/associates/constants";
import { createAssociateService } from "@/src/features/associates/server/associate.service";
import type {
  AssociateCategory,
  AssociateFilters,
  AssociateStatus,
} from "@/src/features/associates/types";

export const metadata: Metadata = {
  title: "Associados",
  description: "Listagem operacional de associados do DocFleet.",
};

type AssociatesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AssociatesPage({ searchParams }: AssociatesPageProps) {
  const user = await getCurrentUser();
  const associateService = createAssociateService();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const filterValues = parseAssociatesFilterValues(resolvedSearchParams);
  const successFeedback = parseSuccessFeedback(resolvedSearchParams);
  const filters: AssociateFilters = {
    page: 1,
    pageSize: 50,
    ...(filterValues.search ? { search: filterValues.search } : {}),
    ...(filterValues.cpf ? { cpf: filterValues.cpf } : {}),
    ...(filterValues.category ? { category: filterValues.category } : {}),
    ...(filterValues.status ? { status: filterValues.status } : {}),
  };
  const associates = await associateService.listAssociates(filters);
  const hasActiveFilters = Boolean(
    filterValues.search ||
      filterValues.cpf ||
      filterValues.category ||
      filterValues.status,
  );

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 px-6 py-10 sm:px-10 lg:px-12 lg:py-16">
      <div className="flex w-full flex-col gap-8">
        <section className="rounded-[32px] border border-[var(--color-border)] bg-[var(--color-card)] p-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
                Gestao de associados
              </p>
              <div>
                <h1 className="text-4xl font-semibold tracking-tight text-[var(--color-foreground)]">
                  Base de associados
                </h1>
                <p className="mt-2 max-w-3xl text-base leading-7 text-[var(--color-muted)]">
                  Visualize a relacao de associados, acompanhe categoria, situacao e
                  data de entrada em uma interface preparada para crescer com a
                  feature.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-white/80 px-5 py-4 text-sm text-[var(--color-muted)]">
              <p className="font-semibold text-[var(--color-foreground)]">{user.name}</p>
              <p>{user.email}</p>
              <Link
                href="/associados/novo"
                className="inline-flex h-10 items-center justify-center rounded-full bg-[#f97316] px-4 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(249,115,22,0.28)] transition-colors hover:bg-[#ea580c]"
              >
                Novo associado
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          <MetricCard label="Associados" value={String(associates.length)} />
          <MetricCard
            label="Ativos"
            value={String(associates.filter((associate) => associate.status === "Ativo").length)}
          />
          <MetricCard
            label="Categorias"
            value={String(new Set(associates.map((associate) => associate.category)).size)}
          />
        </section>

        <AssociatesFilters values={filterValues} />

        <AssociatesListSection
          initialAssociates={associates}
          hasActiveFilters={hasActiveFilters}
          initialFeedback={
            successFeedback
              ? {
                  type: "success",
                  message: successFeedback,
                }
              : null
          }
        />
      </div>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
        {label}
      </p>
      <p className="mt-4 text-4xl font-semibold tracking-tight text-[var(--color-foreground)]">
        {value}
      </p>
    </article>
  );
}

function parseAssociatesFilterValues(
  searchParams?: Record<string, string | string[] | undefined>,
): AssociatesFilterValues {
  const search = getSingleSearchParam(searchParams?.search).trim();
  const cpf = getSingleSearchParam(searchParams?.cpf).trim();
  const categoryValue = getSingleSearchParam(searchParams?.category);
  const statusValue = getSingleSearchParam(searchParams?.status);

  return {
    search,
    cpf,
    category: isAssociateCategory(categoryValue) ? categoryValue : "",
    status: isAssociateStatus(statusValue) ? statusValue : "",
  };
}

function parseSuccessFeedback(
  searchParams?: Record<string, string | string[] | undefined>,
) {
  const success = getSingleSearchParam(searchParams?.success);

  if (success === "created") {
    return "Associado cadastrado com sucesso.";
  }

  if (success === "updated") {
    return "Associado atualizado com sucesso.";
  }

  return null;
}

function getSingleSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function isAssociateCategory(value: string): value is AssociateCategory {
  return associateCategories.includes(value as AssociateCategory);
}

function isAssociateStatus(value: string): value is AssociateStatus {
  return associateStatuses.includes(value as AssociateStatus);
}

import type { Metadata } from "next";
import Link from "next/link";
import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/features/auth/server/session";
import { AssociatesFilters, type AssociatesFilterValues } from "@/features/associates/components/associates-filters";
import { AssociatesListSection } from "@/features/associates/components/associates-list-section";
import { AssociatesPageHeader } from "@/features/associates/components/associates-page-header";
import { FeedbackAlert } from "@/features/associates/components/feedback-alert";
import { associateCategories, associateStatuses } from "@/features/associates/constants";
import {
  canCreateAssociate,
  canDeleteAssociate,
  canEditAssociate,
  canViewAssociates,
  getAssociateAccessMessage,
} from "@/features/associates/lib/associate-authorization";
import { createAssociateService } from "@/features/associates/server/associate.service";
import type {
  Associate,
  AssociateCategory,
  AssociateCategoryCounts,
  AssociateFilters,
  AssociateStatus,
  AssociateStatusCounts,
} from "@/features/associates/types";
import { AppShell } from "@/features/dashboard/components/app-shell";
import { MetricCard } from "@/features/dashboard/components/metric-card";

export const metadata: Metadata = {
  title: "Associados",
  description: "Listagem operacional de associados do DocFleet.",
};

type AssociatesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AssociatesPage({ searchParams }: AssociatesPageProps) {
  const user = await getCurrentUser();
  const canView = canViewAssociates(user);
  const canCreate = canCreateAssociate(user);
  const canEdit = canEditAssociate(user);
  const canDelete = canDeleteAssociate(user);
  const accessMessage = getAssociateAccessMessage(user);
  const associateService = createAssociateService();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const filterValues = parseAssociatesFilterValues(resolvedSearchParams);
  const feedback = parseFeedback(resolvedSearchParams);
  const filters: AssociateFilters = {
    page: 1,
    pageSize: 50,
    ...(filterValues.search ? { search: filterValues.search } : {}),
    ...(filterValues.cpf ? { cpf: filterValues.cpf } : {}),
    ...(filterValues.category ? { category: filterValues.category } : {}),
    ...(filterValues.status ? { status: filterValues.status } : {}),
  };

  let associates: Associate[] = [];
  let totalAssociates = 0;
  let associatesByStatus = createEmptyStatusCounts();
  let associatesByCategory = createEmptyCategoryCounts();
  let loadError: string | null = null;

  if (canView) {
    try {
      [associates, totalAssociates, associatesByStatus, associatesByCategory] =
        await Promise.all([
          associateService.listAssociates(filters),
          associateService.countAllAssociates(),
          associateService.countByStatus(),
          associateService.countByCategory(),
        ]);
    } catch (error) {
      logger.error("associates.page.load_error", {
        userId: user.id,
        error,
      });
      loadError =
        "Tivemos um problema ao buscar os associados. Atualize a página para tentar novamente.";
    }
  }

  const hasActiveFilters = Boolean(
    filterValues.search ||
      filterValues.cpf ||
      filterValues.category ||
      filterValues.status,
  );
  const activeCategories = Object.values(associatesByCategory).filter(
    (count) => count > 0,
  ).length;

  return (
    <AppShell user={user}>
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 py-2 sm:py-4">
        <AssociatesPageHeader
          eyebrow="Gestão de associados"
          title="Base de associados"
          description="Visualize a relação de associados, acompanhe categoria, situação e data de entrada em uma interface alinhada ao centro operacional do DocFleet."
          userName={user.name}
          userEmail={user.email}
          supportingBadge={
            <span className="inline-flex h-10 w-fit items-center rounded-full bg-[#FFF7ED] px-4 text-sm font-semibold text-[#C2410C]">
              {user.role}
            </span>
          }
          action={
            canCreate ? (
              <Link
                href="/associados/novo"
                className="inline-flex h-10 items-center justify-center rounded-full border border-[#E5E7EB] bg-white px-4 text-sm font-semibold text-[#0F172A] transition-colors hover:bg-[#FFF7ED]"
              >
                Novo associado
              </Link>
            ) : (
              <button
                type="button"
                disabled
                title={accessMessage ?? undefined}
                className="inline-flex h-10 items-center justify-center rounded-full border border-[#E5E7EB] bg-slate-100 px-4 text-sm font-semibold text-slate-400"
              >
                Novo associado
              </button>
            )
          }
        />

        {!canView ? (
          <FeedbackAlert
            type="error"
            title="Acesso negado"
            message={accessMessage ?? "Acesso negado ao módulo de associados."}
          />
        ) : null}

        {canView ? (
          <>
            <section className="grid gap-5 xl:grid-cols-3">
              <MetricCard
                metric={{
                  label: "Associados",
                  value: totalAssociates,
                  helper: "Quantidade total de associados cadastrados no sistema.",
                }}
              />
              <MetricCard
                metric={{
                  label: "Ativos",
                  value: associatesByStatus.Ativo,
                  helper: "Associados em situação ativa na base completa.",
                }}
              />
              <MetricCard
                metric={{
                  label: "Categorias",
                  value: activeCategories,
                  helper: "Categorias com pelo menos um associado na base atual.",
                }}
              />
            </section>

            <AssociatesFilters values={filterValues} />

            <AssociatesListSection
              initialAssociates={associates}
              hasActiveFilters={hasActiveFilters}
              canCreate={canCreate}
              canEdit={canEdit}
              canDelete={canDelete}
              accessMessage={accessMessage}
              loadError={loadError}
              initialFeedback={feedback}
            />
          </>
        ) : null}
      </div>
    </AppShell>
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

function parseFeedback(
  searchParams?: Record<string, string | string[] | undefined>,
): {
  type: "success" | "error" | "info";
  message: string;
} | null {
  const success = getSingleSearchParam(searchParams?.success);

  if (success === "created") {
    return {
      type: "success",
      message: "Associado cadastrado com sucesso.",
    };
  }

  if (success === "updated") {
    return {
      type: "success",
      message: "Associado atualizado com sucesso.",
    };
  }

  if (success === "deleted") {
    return {
      type: "success",
      message: "Associado excluído com sucesso.",
    };
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

function createEmptyStatusCounts(): AssociateStatusCounts {
  return Object.fromEntries(
    associateStatuses.map((status) => [status, 0]),
  ) as AssociateStatusCounts;
}

function createEmptyCategoryCounts(): AssociateCategoryCounts {
  return Object.fromEntries(
    associateCategories.map((category) => [category, 0]),
  ) as AssociateCategoryCounts;
}

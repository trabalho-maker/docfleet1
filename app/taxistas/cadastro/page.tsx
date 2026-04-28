import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/features/auth/server/session";
import {
  canEditAssociate,
  canViewAssociates,
  getAssociateAccessMessage,
} from "@/features/associates/lib/associate-authorization";
import { FeedbackAlert } from "@/features/associates/components/feedback-alert";
import { AppShell } from "@/features/dashboard/components/app-shell";
import { ModuleHeader } from "@/features/dashboard/components/module-header";
import { TaxistaCadastroSection } from "@/features/taxistas/cadastro/components/taxista-cadastro-section";
import { createTaxistaCadastroService } from "@/features/taxistas/cadastro/server/taxista-cadastro.service";
import type { TaxistaCadastroFilterMode } from "@/features/taxistas/cadastro/types";

const DEFAULT_PAGE_SIZE = 25;

export const metadata: Metadata = {
  title: "Cadastro de taxistas",
  description: "Gerenciamento operacional do cadastro do modulo TAXISTAS.",
};

export default async function TaxistasCadastroPage({
  searchParams,
}: PageProps<"/taxistas/cadastro">) {
  const user = await getCurrentUser();
  const canView = canViewAssociates(user);
  const canEdit = canEditAssociate(user);
  const accessMessage = getAssociateAccessMessage(user);
  const resolvedSearchParams = await searchParams;
  const selectedAssociateId = getSingleSearchParam(resolvedSearchParams?.taxista);
  const filters = {
    search: getSingleSearchParam(resolvedSearchParams?.q),
    mode: getFilterMode(getSingleSearchParam(resolvedSearchParams?.mode)),
    page: parsePositiveInteger(getSingleSearchParam(resolvedSearchParams?.page), 1),
    pageSize: DEFAULT_PAGE_SIZE,
  } as const;
  const service = createTaxistaCadastroService();
  const listResult = canView
    ? await service.listTaxistas(filters)
    : {
        records: [],
        counts: { all: 0, protocolado: 0, pronto: 0 },
        total: 0,
        page: 1,
        pageSize: DEFAULT_PAGE_SIZE,
        totalPages: 1,
      };
  const selectedRecord =
    canView && selectedAssociateId
      ? await service.getTaxistaByAssociateId(selectedAssociateId)
      : null;
  const headerMetrics = [
    { label: "Cadastrados", value: listResult.counts.all },
    {
      label: "Protocolado",
      value: listResult.counts.protocolado,
    },
    {
      label: "Pronto",
      value: listResult.counts.pronto,
    },
  ];

  return (
    <AppShell user={user}>
      <div className="flex w-full flex-1 flex-col gap-6 py-2 sm:py-4">
        <ModuleHeader
          title="Cadastro"
          metrics={headerMetrics}
          actions={
            <div className="flex flex-wrap gap-3">
              <Link
                href="/taxistas"
                className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full bg-[#F39C12] px-5 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(243,156,18,0.28)] transition hover:brightness-95"
              >
                Voltar ao modulo
              </Link>
              {canEdit ? (
                <Link
                  href="/associados"
                  className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full bg-[#F39C12] px-5 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(243,156,18,0.28)] transition hover:brightness-95"
                >
                  Base de associados
                </Link>
              ) : null}
            </div>
          }
        />

        {!canView ? (
          <FeedbackAlert
            type="error"
            title="Acesso negado"
            message={accessMessage ?? "Seu perfil nao pode acessar o cadastro de taxistas."}
          />
        ) : null}

        {canView ? (
          <TaxistaCadastroSection
            user={user}
            records={listResult.records}
            counts={listResult.counts}
            total={listResult.total}
            page={listResult.page}
            pageSize={listResult.pageSize}
            totalPages={listResult.totalPages}
            initialSearch={filters.search}
            initialMode={filters.mode}
            initialSelectedAssociateId={selectedAssociateId}
            selectedRecord={selectedRecord}
          />
        ) : null}
      </div>
    </AppShell>
  );
}

function getSingleSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function getFilterMode(value: string): TaxistaCadastroFilterMode {
  if (value === "PROTOCOLADO" || value === "PRONTO") {
    return value;
  }

  return "ALL";
}

function parsePositiveInteger(value: string, fallback: number) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

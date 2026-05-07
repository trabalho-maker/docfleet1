import {
  SqliteAssociateRepository,
  type AssociateRepository,
} from "@/features/associates/server/associate.repository";
import {
  SqliteAssociateProfileRepository,
  createEmptyAssociateProfile,
  type AssociateProfileRepository,
} from "@/features/associates/server/associate-profile.repository";
import type { Associate, AssociateProfileCategory } from "@/features/associates/types";
import type { DatabaseAdapter } from "@/lib/database/adapter";
import { getDatabaseAdapter } from "@/lib/database/provider";
import { createSessionDatabaseAdapter } from "@/lib/database/session-adapter";
import {
  SqliteMembershipFeeRepository,
  type MembershipFeeRepository,
} from "@/features/membership-fees/server/membership-fee.repository";
import type {
  ConfirmMembershipPaymentInput,
  MembershipFeeAssociateSnapshot,
  MembershipFeeMonthState,
  MembershipFeeOverview,
  MembershipFeeOverviewEntry,
  MembershipFeeOverviewFilters,
  MembershipFeeOverviewStatusFilter,
  MembershipFeePayment,
  MembershipFeeSheet,
  MembershipFeeSheetView,
  ReverseMembershipPaymentInput,
} from "@/features/membership-fees/types";

const MONTH_LABELS = [
  "Janeiro",
  "Fevereiro",
  "Marco",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

export class MembershipFeeValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MembershipFeeValidationError";
  }
}

export class MembershipFeeConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MembershipFeeConflictError";
  }
}

export class MembershipFeeNotFoundError extends Error {
  constructor(message = "MEMBERSHIP_FEE_NOT_FOUND") {
    super(message);
    this.name = "MembershipFeeNotFoundError";
  }
}

type MembershipFeeServiceOptions = {
  adapter?: DatabaseAdapter;
  repository?: MembershipFeeRepository;
  associateRepository?: AssociateRepository;
  profileRepository?: AssociateProfileRepository;
  repositoryFactory?: (adapter: DatabaseAdapter) => MembershipFeeRepository;
  associateRepositoryFactory?: (adapter: DatabaseAdapter) => AssociateRepository;
  profileRepositoryFactory?: (adapter: DatabaseAdapter) => AssociateProfileRepository;
};

type MembershipRepositories = {
  repository: MembershipFeeRepository;
  associateRepository: AssociateRepository;
  profileRepository: AssociateProfileRepository;
};

export function createMembershipFeeService(
  options: MembershipFeeServiceOptions = {},
) {
  const adapter = options.adapter ?? getDatabaseAdapter();
  const repositoryFactory =
    options.repositoryFactory ??
    ((scopedAdapter: DatabaseAdapter) => new SqliteMembershipFeeRepository(scopedAdapter));
  const associateRepositoryFactory =
    options.associateRepositoryFactory ??
    ((scopedAdapter: DatabaseAdapter) => new SqliteAssociateRepository(scopedAdapter));
  const profileRepositoryFactory =
    options.profileRepositoryFactory ??
    ((scopedAdapter: DatabaseAdapter) =>
      new SqliteAssociateProfileRepository(scopedAdapter));
  const repository = options.repository ?? repositoryFactory(adapter);
  const associateRepository =
    options.associateRepository ?? associateRepositoryFactory(adapter);
  const profileRepository =
    options.profileRepository ?? profileRepositoryFactory(adapter);
  const canUseScopedTransaction =
    !options.repository && !options.associateRepository && !options.profileRepository;

  async function runWriteOperation<T>(
    operation: (repositories: MembershipRepositories) => Promise<T>,
  ) {
    if (!canUseScopedTransaction) {
      return operation({
        repository,
        associateRepository,
        profileRepository,
      });
    }

    return adapter.write(async (session) => {
      const scopedAdapter = createSessionDatabaseAdapter(adapter.provider, session);

      return operation({
        repository: repositoryFactory(scopedAdapter),
        associateRepository: associateRepositoryFactory(scopedAdapter),
        profileRepository: profileRepositoryFactory(scopedAdapter),
      });
    });
  }

  return {
    async getOrCreateCurrentSheet(associateId: string, currentDate = new Date()) {
      const normalizedAssociateId = normalizeRequiredId(associateId);
      const referenceYear = getReferenceYear(currentDate);

      return runWriteOperation(async (repositories) => {
        const associate = await getAssociateWithProfile(
          repositories.associateRepository,
          repositories.profileRepository,
          normalizedAssociateId,
        );
        const sheet = await ensureSheetForYear(
          repositories,
          associate,
          referenceYear,
          "active",
        );

        return buildSheetView(
          repositories.repository,
          associate,
          sheet,
          currentDate,
        );
      });
    },

    async getMembershipFeeSheet(
      associateId: string,
      year: number,
      currentDate = new Date(),
    ) {
      const normalizedAssociateId = normalizeRequiredId(associateId);
      const referenceYear = normalizeReferenceYear(year);

      if (referenceYear === getReferenceYear(currentDate)) {
        return this.getOrCreateCurrentSheet(normalizedAssociateId, currentDate);
      }

      const associate = await getAssociateWithProfile(
        associateRepository,
        profileRepository,
        normalizedAssociateId,
      );
      const sheet = await repository.findSheetByAssociateIdAndYear(
        normalizedAssociateId,
        referenceYear,
      );

      if (!sheet) {
        throw new MembershipFeeNotFoundError("MEMBERSHIP_FEE_SHEET_NOT_FOUND");
      }

      return buildSheetView(repository, associate, sheet, currentDate);
    },

    async confirmMembershipPayment(
      input: ConfirmMembershipPaymentInput,
      currentDate = new Date(),
    ) {
      const normalizedAssociateId = normalizeRequiredId(input.associateId);
      const competenceYear = normalizeReferenceYear(input.competenceYear);
      const competenceMonth = normalizeCompetenceMonth(input.competenceMonth);

      return runWriteOperation(async (repositories) => {
        const associate = await getAssociateWithProfile(
          repositories.associateRepository,
          repositories.profileRepository,
          normalizedAssociateId,
        );
        const currentReferenceYear = getReferenceYear(currentDate);
        const sheet =
          competenceYear === currentReferenceYear
            ? await ensureSheetForYear(
                repositories,
                associate,
                competenceYear,
                "active",
              )
            : await ensureSheetForYear(
                repositories,
                associate,
                competenceYear,
                "archived",
              );
        const existingPayment = await repositories.repository.findPaymentByCompetence(
          normalizedAssociateId,
          competenceYear,
          competenceMonth,
        );

        if (existingPayment) {
          throw new MembershipFeeConflictError("MEMBERSHIP_FEE_ALREADY_PAID");
        }

        return repositories.repository.createPayment({
          sheetId: sheet.id,
          associateId: normalizedAssociateId,
          competenceYear,
          competenceMonth,
          paidAt: currentDate.toISOString(),
          paidByUserId: input.paidByUserId ?? null,
          notes: input.notes ?? null,
        });
      });
    },

    async reverseMembershipPayment(
      input: ReverseMembershipPaymentInput,
    ) {
      const normalizedAssociateId = normalizeRequiredId(input.associateId);
      const competenceYear = normalizeReferenceYear(input.competenceYear);
      const competenceMonth = normalizeCompetenceMonth(input.competenceMonth);

      return runWriteOperation(async (repositories) => {
        await getAssociateWithProfile(
          repositories.associateRepository,
          repositories.profileRepository,
          normalizedAssociateId,
        );
        const existingPayment = await repositories.repository.findPaymentByCompetence(
          normalizedAssociateId,
          competenceYear,
          competenceMonth,
        );

        if (!existingPayment) {
          throw new MembershipFeeNotFoundError("MEMBERSHIP_FEE_PAYMENT_NOT_FOUND");
        }

        await repositories.repository.deletePaymentById(existingPayment.id);

        return existingPayment;
      });
    },

    calculateMembershipStatus,

    async listMembershipFeeOverview(
      filters: MembershipFeeOverviewFilters = {},
      currentDate = new Date(),
    ): Promise<MembershipFeeOverview> {
      const normalizedFilters = normalizeOverviewFilters(filters);
      const currentYear = getReferenceYear(currentDate);
      const associates = await listOverviewAssociates(adapter);
      const totalAssociates = associates.length;

      if (totalAssociates === 0) {
        return {
          entries: [],
          counts: {
            upToDate: 0,
            oneOverdue: 0,
            twoOverdue: 0,
            threePlusOverdue: 0,
          },
          totalAssociates: 0,
          filteredAssociates: 0,
        };
      }

      const associateIds = associates.map((associate) => associate.id);
      const [currentSheets, currentYearPayments, latestPaymentDates] = await Promise.all([
        listOverviewSheetsByAssociateIdsAndYear(adapter, associateIds, currentYear),
        listOverviewPaymentsByAssociateIdsAndYear(adapter, associateIds, currentYear),
        listLatestPaymentDatesByAssociateIds(adapter, associateIds),
      ]);
      const sheetByAssociateId = new Map(
        currentSheets.map((sheet) => [sheet.associateId, sheet]),
      );
      const paymentsByAssociateId = new Map<string, MembershipFeePayment[]>();

      for (const payment of currentYearPayments) {
        const existingPayments = paymentsByAssociateId.get(payment.associateId) ?? [];
        existingPayments.push(payment);
        paymentsByAssociateId.set(payment.associateId, existingPayments);
      }

      const entriesBeforeStatusFilter: MembershipFeeOverviewEntry[] = [];

      for (const associate of associates) {
        if (!matchesOverviewSearch(associate, normalizedFilters.search)) {
          continue;
        }

        if (!matchesOverviewCategory(associate, normalizedFilters.category)) {
          continue;
        }

        const currentSheet =
          sheetByAssociateId.get(associate.id) ??
          buildTransientCurrentSheet(associate, currentYear);
        const calculatedStatus = calculateMembershipStatus(
          currentSheet,
          paymentsByAssociateId.get(associate.id) ?? [],
          currentDate,
        );

        entriesBeforeStatusFilter.push({
          associateId: associate.id,
          name: associate.name,
          category: associate.modalidadeAssociado,
          categoryLabel: formatOverviewCategoryLabel(associate),
          registrationNumber: associate.registrationNumber,
          phone: associate.telefone ?? associate.celular,
          overdueMonths: calculatedStatus.summary.totalOverdueMonths,
          statusLabel: buildOverviewStatusLabel(calculatedStatus.summary),
          statusTone: buildOverviewStatusTone(calculatedStatus.summary),
          lastPaymentAt: latestPaymentDates.get(associate.id) ?? null,
          currentYear,
        });
      }

      const counts = buildOverviewCounts(entriesBeforeStatusFilter);
      const entries = entriesBeforeStatusFilter
        .filter((entry) =>
          matchesOverviewStatus(entry.overdueMonths, normalizedFilters.status),
        )
        .sort((left, right) => {
          if (right.overdueMonths !== left.overdueMonths) {
            return right.overdueMonths - left.overdueMonths;
          }

          return left.name.localeCompare(right.name, "pt-BR");
        });

      return {
        entries,
        counts,
        totalAssociates,
        filteredAssociates: entries.length,
      };
    },

    async getChargeMessage(associateId: string, currentDate = new Date()) {
      const normalizedAssociateId = normalizeRequiredId(associateId);
      const associate = await getAssociateWithProfile(
        associateRepository,
        profileRepository,
        normalizedAssociateId,
      );
      const sheets = await repository.listSheetsByAssociateId(normalizedAssociateId);
      const payments = await repository.findPaymentsByAssociateId(normalizedAssociateId);

      return buildChargeMessage(associate, sheets, payments, currentDate);
    },
  };
}

async function ensureSheetForYear(
  repositories: MembershipRepositories,
  associate: Associate,
  referenceYear: number,
  targetStatus: MembershipFeeSheet["status"],
) {
  const existingSheet = await repositories.repository.findSheetByAssociateIdAndYear(
    associate.id,
    referenceYear,
  );

  if (existingSheet) {
    if (targetStatus === "active" && existingSheet.status !== "active") {
      await repositories.repository.archiveSheetsByAssociateId(associate.id);
      await repositories.repository.activateSheet(existingSheet.id);

      return {
        ...existingSheet,
        status: "active" as const,
      };
    }

    return existingSheet;
  }

  if (targetStatus === "active") {
    await repositories.repository.archiveSheetsByAssociateId(associate.id);
  }

  return repositories.repository.createSheet({
    associateId: associate.id,
    referenceYear,
    status: targetStatus,
    snapshotName: associate.name,
    snapshotAddress: associate.enderecoCompleto,
    snapshotCategory: associate.modalidadeAssociado ?? associate.category,
    snapshotPhone: associate.telefone ?? associate.celular,
    snapshotRegistrationSuffix: extractRegistrationSuffix(associate.registrationNumber),
    snapshotInss: null,
  });
}

async function getAssociateWithProfile(
  associateRepository: AssociateRepository,
  profileRepository: AssociateProfileRepository,
  associateId: string,
) {
  const associate = await associateRepository.findById(associateId);

  if (!associate) {
    throw new MembershipFeeNotFoundError("ASSOCIATE_NOT_FOUND");
  }

  const profile =
    (await profileRepository.findByAssociateId(associateId)) ??
    createEmptyAssociateProfile();

  return {
    ...associate,
    ...profile,
  };
}

async function buildSheetView(
  repository: MembershipFeeRepository,
  associate: Associate,
  sheet: MembershipFeeSheet,
  currentDate: Date,
): Promise<MembershipFeeSheetView> {
  const [payments, availableYears, allSheets, allPayments] = await Promise.all([
    repository.findPaymentsBySheetId(sheet.id),
    repository.listSheetYearsByAssociateId(sheet.associateId),
    repository.listSheetsByAssociateId(sheet.associateId),
    repository.findPaymentsByAssociateId(sheet.associateId),
  ]);
  const calculatedStatus = calculateMembershipStatus(sheet, payments, currentDate);
  const chargeMessage = buildChargeMessage(
    associate,
    allSheets,
    allPayments,
    currentDate,
  );

  return {
    associate: buildAssociateSnapshot(sheet, associate),
    sheet,
    payments,
    months: calculatedStatus.months,
    availableYears,
    summary: calculatedStatus.summary,
    chargeMessage: chargeMessage.message,
    chargeEligible: chargeMessage.allowed,
  };
}

function buildAssociateSnapshot(
  sheet: MembershipFeeSheet,
  associate: Associate,
): MembershipFeeAssociateSnapshot {
  return {
    id: associate.id,
    name: associate.name,
    registrationNumber: associate.registrationNumber,
    displayName: sheet.snapshotName ?? associate.name,
    displayAddress: sheet.snapshotAddress ?? associate.enderecoCompleto,
    displayCategory:
      sheet.snapshotCategory ?? associate.modalidadeAssociado ?? associate.category,
    displayPhone: sheet.snapshotPhone ?? associate.telefone ?? associate.celular,
    displayRegistrationSuffix:
      sheet.snapshotRegistrationSuffix ??
      extractRegistrationSuffix(associate.registrationNumber),
    displayInss: sheet.snapshotInss ?? null,
  };
}

export function calculateMembershipStatus(
  sheet: MembershipFeeSheet,
  payments: MembershipFeePayment[],
  currentDate = new Date(),
) {
  const referenceYear = sheet.referenceYear;
  const currentYear = getReferenceYear(currentDate);
  const currentMonth = getReferenceMonth(currentDate);
  const paymentByMonth = new Map(
    payments.map((payment) => [payment.competenceMonth, payment]),
  );
  const months: MembershipFeeMonthState[] = [];

  for (let month = 1; month <= 12; month += 1) {
    const payment = paymentByMonth.get(month);
    const competenceLabel = `${String(month).padStart(2, "0")}/${referenceYear}`;
    let status: MembershipFeeMonthState["status"];

    if (payment) {
      status = "paid";
    } else if (
      referenceYear > currentYear ||
      (referenceYear === currentYear && month > currentMonth)
    ) {
      status = "future";
    } else if (referenceYear === currentYear && month === currentMonth) {
      status = "current_open";
    } else {
      status = "overdue";
    }

    months.push({
      month,
      monthLabel: MONTH_LABELS[month - 1],
      competenceLabel,
      status,
      paidAt: payment?.paidAt ?? null,
      canConfirmPayment: !payment,
    });
  }

  const provisionalOverdueCount = months.filter(
    (month) => month.status === "overdue",
  ).length;

  if (provisionalOverdueCount >= 3) {
    for (const month of months) {
      if (month.status === "overdue") {
        month.status = "critical_overdue";
      }
    }
  }

  const summary = {
    paidMonths: months.filter((month) => month.status === "paid").length,
    currentOpenMonths: months.filter((month) => month.status === "current_open").length,
    futureMonths: months.filter((month) => month.status === "future").length,
    overdueMonths: months.filter((month) => month.status === "overdue").length,
    criticalMonths: months.filter((month) => month.status === "critical_overdue").length,
    totalOverdueMonths: months.filter(
      (month) =>
        month.status === "overdue" || month.status === "critical_overdue",
    ).length,
  };

  return {
    months,
    summary,
  };
}

function buildChargeMessage(
  associate: Associate,
  sheets: MembershipFeeSheet[],
  payments: MembershipFeePayment[],
  currentDate: Date,
) {
  const overdueCompetencies = sheets.flatMap((sheet) => {
    const sheetPayments = payments.filter((payment) => payment.sheetId === sheet.id);
    const calculatedStatus = calculateMembershipStatus(sheet, sheetPayments, currentDate);

    return calculatedStatus.months.filter(
      (month) =>
        month.status === "overdue" || month.status === "critical_overdue",
    );
  });

  if (overdueCompetencies.length < 2) {
    return {
      allowed: false,
      message: null,
      overdueCompetencies,
    };
  }

  return {
    allowed: true,
    message: `Sr(a). ${associate.name}, identificamos atraso no pagamento da sua mensalidade junto ao Sindicato. Solicitamos, por gentileza, que compareca ao Sindicato ou entre em contato para regularizacao. Caso ja tenha regularizado, desconsidere esta mensagem.`,
    overdueCompetencies,
  };
}

async function listOverviewAssociates(adapter: DatabaseAdapter): Promise<Associate[]> {
  const rows = await adapter.query(`
    SELECT
      associates.id,
      associates.name,
      associates.cpf,
      associates.category,
      associates.registration_number,
      associates.status,
      associates.admission_date,
      associates.created_at,
      associates.updated_at,
      associate_profiles.modalidade_associado,
      associate_profiles.cnpj_empresa,
      associate_profiles.nome_empresa,
      associate_profiles.endereco_completo,
      associate_profiles.bairro,
      associate_profiles.cidade,
      associate_profiles.estado,
      associate_profiles.cep,
      associate_profiles.profissao,
      associate_profiles.sexo,
      associate_profiles.data_nascimento,
      associate_profiles.nacionalidade,
      associate_profiles.naturalidade,
      associate_profiles.rg,
      associate_profiles.cnh,
      associate_profiles.estado_civil,
      associate_profiles.nome_pai,
      associate_profiles.nome_mae,
      associate_profiles.dependentes,
      associate_profiles.grau_parentesco,
      associate_profiles.telefone,
      associate_profiles.celular,
      associate_profiles.email,
      associate_profiles.observacoes,
      associate_profiles.situacao_financeira,
      associate_profiles.situacao_documental,
      associate_profiles.historico_resumo,
      associate_profiles.foto_url
    FROM associates
    LEFT JOIN associate_profiles
      ON associate_profiles.associate_id = associates.id
    ORDER BY associates.name ASC
  `);

  return rows.map((row) => {
    const emptyProfile = createEmptyAssociateProfile();

    return {
      id: String(row[0]),
      name: String(row[1]),
      cpf: String(row[2]),
      category: String(row[3]) as Associate["category"],
      registrationNumber: String(row[4]),
      status: String(row[5]) as Associate["status"],
      admissionDate: String(row[6]),
      createdAt: String(row[7]),
      updatedAt: String(row[8]),
      ...emptyProfile,
      modalidadeAssociado: normalizeOverviewCategory(row[9]),
      cnpjEmpresa: normalizeOverviewNullable(row[10]),
      nomeEmpresa: normalizeOverviewNullable(row[11]),
      enderecoCompleto: normalizeOverviewNullable(row[12]),
      bairro: normalizeOverviewNullable(row[13]),
      cidade: normalizeOverviewNullable(row[14]),
      estado: normalizeOverviewNullable(row[15]),
      cep: normalizeOverviewNullable(row[16]),
      profissao: normalizeOverviewNullable(row[17]),
      sexo: normalizeOverviewNullable(row[18]) as Associate["sexo"],
      dataNascimento: normalizeOverviewNullable(row[19]),
      nacionalidade: normalizeOverviewNullable(row[20]),
      naturalidade: normalizeOverviewNullable(row[21]),
      rg: normalizeOverviewNullable(row[22]),
      cnh: normalizeOverviewNullable(row[23]),
      estadoCivil: normalizeOverviewNullable(row[24]),
      nomePai: normalizeOverviewNullable(row[25]),
      nomeMae: normalizeOverviewNullable(row[26]),
      dependentes: normalizeOverviewNullable(row[27]),
      grauParentesco: normalizeOverviewNullable(row[28]),
      telefone: normalizeOverviewNullable(row[29]),
      celular: normalizeOverviewNullable(row[30]),
      email: normalizeOverviewNullable(row[31]),
      observacoes: normalizeOverviewNullable(row[32]),
      situacaoFinanceira: normalizeOverviewNullable(row[33]),
      situacaoDocumental: normalizeOverviewNullable(row[34]),
      historicoResumo: normalizeOverviewNullable(row[35]),
      fotoUrl: normalizeOverviewNullable(row[36]),
    };
  });
}

async function listOverviewSheetsByAssociateIdsAndYear(
  adapter: DatabaseAdapter,
  associateIds: string[],
  referenceYear: number,
) {
  if (associateIds.length === 0) {
    return [];
  }

  const rows = await adapter.query(
    `
      SELECT
        id,
        associate_id,
        reference_year,
        status,
        snapshot_name,
        snapshot_address,
        snapshot_category,
        snapshot_phone,
        snapshot_registration_suffix,
        snapshot_inss,
        created_at,
        updated_at
      FROM membership_fee_sheets
      WHERE reference_year = ?
        AND associate_id IN (${buildSqliteInClause(associateIds.length)})
    `,
    [referenceYear, ...associateIds],
  );

  return rows.map((row) => ({
    id: String(row[0]),
    associateId: String(row[1]),
    referenceYear: Number(row[2]),
    status: String(row[3]) as MembershipFeeSheet["status"],
    snapshotName: normalizeOverviewNullable(row[4]),
    snapshotAddress: normalizeOverviewNullable(row[5]),
    snapshotCategory: normalizeOverviewNullable(row[6]),
    snapshotPhone: normalizeOverviewNullable(row[7]),
    snapshotRegistrationSuffix: normalizeOverviewNullable(row[8]),
    snapshotInss: normalizeOverviewNullable(row[9]),
    createdAt: String(row[10]),
    updatedAt: String(row[11]),
  }));
}

async function listOverviewPaymentsByAssociateIdsAndYear(
  adapter: DatabaseAdapter,
  associateIds: string[],
  competenceYear: number,
) {
  if (associateIds.length === 0) {
    return [];
  }

  const rows = await adapter.query(
    `
      SELECT
        id,
        sheet_id,
        associate_id,
        competence_year,
        competence_month,
        paid_at,
        paid_by_user_id,
        notes,
        created_at,
        updated_at
      FROM membership_fee_payments
      WHERE competence_year = ?
        AND associate_id IN (${buildSqliteInClause(associateIds.length)})
      ORDER BY associate_id ASC, competence_month ASC, paid_at ASC
    `,
    [competenceYear, ...associateIds],
  );

  return rows.map((row) => ({
    id: String(row[0]),
    sheetId: String(row[1]),
    associateId: String(row[2]),
    competenceYear: Number(row[3]),
    competenceMonth: Number(row[4]),
    paidAt: String(row[5]),
    paidByUserId: normalizeOverviewNullable(row[6]),
    notes: normalizeOverviewNullable(row[7]),
    createdAt: String(row[8]),
    updatedAt: String(row[9]),
  }));
}

async function listLatestPaymentDatesByAssociateIds(
  adapter: DatabaseAdapter,
  associateIds: string[],
) {
  const latestDates = new Map<string, string>();

  if (associateIds.length === 0) {
    return latestDates;
  }

  const rows = await adapter.query(
    `
      SELECT associate_id, MAX(paid_at)
      FROM membership_fee_payments
      WHERE associate_id IN (${buildSqliteInClause(associateIds.length)})
      GROUP BY associate_id
    `,
    associateIds,
  );

  for (const row of rows) {
    latestDates.set(String(row[0]), String(row[1]));
  }

  return latestDates;
}

function buildTransientCurrentSheet(
  associate: Associate,
  referenceYear: number,
): MembershipFeeSheet {
  return {
    id: `virtual:${associate.id}:${referenceYear}`,
    associateId: associate.id,
    referenceYear,
    status: "active",
    snapshotName: associate.name,
    snapshotAddress: associate.enderecoCompleto,
    snapshotCategory: associate.modalidadeAssociado ?? associate.category,
    snapshotPhone: associate.telefone ?? associate.celular,
    snapshotRegistrationSuffix: extractRegistrationSuffix(associate.registrationNumber),
    snapshotInss: null,
    createdAt: "",
    updatedAt: "",
  };
}

function buildSqliteInClause(length: number) {
  return Array.from({ length }, () => "?").join(", ");
}

function normalizeOverviewNullable(value: unknown) {
  if (value == null) {
    return null;
  }

  const normalizedValue = String(value).trim();
  return normalizedValue ? normalizedValue : null;
}

function normalizeOverviewCategory(
  value: unknown,
): Associate["modalidadeAssociado"] {
  const normalizedValue = normalizeOverviewNullable(value)?.toUpperCase();

  if (
    normalizedValue === "TAXI" ||
    normalizedValue === "ESCOLAR" ||
    normalizedValue === "CAMINHAO" ||
    normalizedValue === "CNPJ"
  ) {
    return normalizedValue;
  }

  return null;
}

function normalizeOverviewFilters(
  filters: MembershipFeeOverviewFilters,
): Required<MembershipFeeOverviewFilters> {
  return {
    search: filters.search?.trim() ?? "",
    category: filters.category ?? "",
    status: filters.status ?? "all",
  };
}

function matchesOverviewSearch(associate: Associate, search: string) {
  if (!search) {
    return true;
  }

  return normalizeSearchValue(associate.name).includes(normalizeSearchValue(search));
}

function matchesOverviewCategory(
  associate: Associate,
  category: AssociateProfileCategory | "",
) {
  if (!category) {
    return true;
  }

  return associate.modalidadeAssociado === category;
}

function matchesOverviewStatus(
  overdueMonths: number,
  status: MembershipFeeOverviewStatusFilter,
) {
  switch (status) {
    case "up_to_date":
      return overdueMonths === 0;
    case "one_overdue":
      return overdueMonths === 1;
    case "two_overdue":
      return overdueMonths === 2;
    case "three_plus_overdue":
      return overdueMonths >= 3;
    default:
      return true;
  }
}

function buildOverviewCounts(entries: MembershipFeeOverviewEntry[]) {
  return {
    upToDate: entries.filter((entry) => entry.overdueMonths === 0).length,
    oneOverdue: entries.filter((entry) => entry.overdueMonths === 1).length,
    twoOverdue: entries.filter((entry) => entry.overdueMonths === 2).length,
    threePlusOverdue: entries.filter((entry) => entry.overdueMonths >= 3).length,
  };
}

function buildOverviewStatusLabel(summary: {
  currentOpenMonths: number;
  totalOverdueMonths: number;
}) {
  if (summary.totalOverdueMonths >= 3) {
    return "3+ meses vencidos";
  }

  if (summary.totalOverdueMonths === 2) {
    return "2 meses vencidos";
  }

  if (summary.totalOverdueMonths === 1) {
    return "1 mes vencido";
  }

  if (summary.currentOpenMonths > 0) {
    return "Mes atual em aberto";
  }

  return "Em dia";
}

function buildOverviewStatusTone(summary: {
  currentOpenMonths: number;
  totalOverdueMonths: number;
}): MembershipFeeOverviewEntry["statusTone"] {
  if (summary.totalOverdueMonths >= 3) {
    return "danger";
  }

  if (summary.totalOverdueMonths >= 1) {
    return "warning";
  }

  if (summary.currentOpenMonths > 0) {
    return "warning";
  }

  return "success";
}

function formatOverviewCategoryLabel(associate: Associate) {
  switch (associate.modalidadeAssociado) {
    case "TAXI":
      return "Taxi";
    case "ESCOLAR":
      return "Escolar";
    case "CAMINHAO":
      return "Caminhao";
    case "CNPJ":
      return "CNPJ / Empresas";
    default:
      return associate.category;
  }
}

function normalizeSearchValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function normalizeRequiredId(value: string) {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new MembershipFeeValidationError("ASSOCIATE_ID_REQUIRED");
  }

  return normalizedValue;
}

function normalizeReferenceYear(value: number) {
  if (!Number.isInteger(value) || value < 2000 || value > 9999) {
    throw new MembershipFeeValidationError("MEMBERSHIP_FEE_INVALID_YEAR");
  }

  return value;
}

function normalizeCompetenceMonth(value: number) {
  if (!Number.isInteger(value) || value < 1 || value > 12) {
    throw new MembershipFeeValidationError("MEMBERSHIP_FEE_INVALID_MONTH");
  }

  return value;
}

function getReferenceYear(currentDate: Date) {
  return currentDate.getUTCFullYear();
}

function getReferenceMonth(currentDate: Date) {
  return currentDate.getUTCMonth() + 1;
}

function extractRegistrationSuffix(registrationNumber: string) {
  const digits = registrationNumber.replace(/\D/g, "");

  if (digits.length >= 4) {
    return digits.slice(-4);
  }

  const normalizedRegistration = registrationNumber.trim();
  return normalizedRegistration ? normalizedRegistration.slice(-4) : null;
}

export type MembershipFeeService = ReturnType<typeof createMembershipFeeService>;

import {
  resetSqliteDatabase,
  resetSqliteStorageState,
  withSqliteDatabase,
} from "@/lib/storage/sqlite-storage";
import { createDataLayer } from "@/features/data/repositories";
import { createAssociateService } from "@/features/associates/server/associate.service";
import {
  SqliteMembershipFeeRepository,
} from "@/features/membership-fees/server/membership-fee.repository";
import {
  createMembershipFeeService,
  MembershipFeeConflictError,
} from "@/features/membership-fees/server/membership-fee.service";

describe("membership fee service", () => {
  const repository = new SqliteMembershipFeeRepository();
  const service = createMembershipFeeService();

  beforeEach(async () => {
    await resetSqliteStorageState();
    await resetSqliteDatabase();
  });

  afterAll(async () => {
    await resetSqliteStorageState();
  });

  it("creates a current sheet on demand for seeded associates and avoids duplicates", async () => {
    const currentDate = new Date("2026-04-20T12:00:00.000Z");
    const firstSheet = await service.getOrCreateCurrentSheet("asc_01", currentDate);
    const secondSheet = await service.getOrCreateCurrentSheet("asc_01", currentDate);

    expect(firstSheet.sheet.id).toBe(secondSheet.sheet.id);
    expect(await countSheetsForAssociate("asc_01")).toBe(1);
  });

  it("creates the sheet even when profile data are incomplete", async () => {
    const associate = await createAssociateService().createAssociate({
      name: "Associado Minimo",
      cpf: "529.982.247-25",
      category: "Titular",
      registrationNumber: "MAT-2026-0901",
      status: "Ativo",
      admissionDate: "2026-04-20",
    });
    const currentDate = new Date("2026-04-20T12:00:00.000Z");
    const sheetView = await service.getOrCreateCurrentSheet(associate.id, currentDate);

    expect(sheetView.sheet).toMatchObject({
      associateId: associate.id,
      referenceYear: 2026,
      snapshotName: "Associado Minimo",
      snapshotAddress: null,
      snapshotPhone: null,
      snapshotInss: null,
    });
  });

  it("creates a new sheet in a new year without deleting prior history", async () => {
    const sheet2026 = await service.getOrCreateCurrentSheet(
      "asc_01",
      new Date("2026-07-10T12:00:00.000Z"),
    );
    const sheet2027 = await service.getOrCreateCurrentSheet(
      "asc_01",
      new Date("2027-01-10T12:00:00.000Z"),
    );
    const years = await repository.listSheetYearsByAssociateId("asc_01");
    const stored2026 = await repository.findSheetByAssociateIdAndYear("asc_01", 2026);
    const stored2027 = await repository.findSheetByAssociateIdAndYear("asc_01", 2027);

    expect(sheet2026.sheet.referenceYear).toBe(2026);
    expect(sheet2027.sheet.referenceYear).toBe(2027);
    expect(years).toEqual([2027, 2026]);
    expect(stored2026?.status).toBe("archived");
    expect(stored2027?.status).toBe("active");
  });

  it("confirms payment and stores the real paid_at timestamp", async () => {
    const paidAt = "2026-08-10T14:30:00.000Z";

    const payment = await service.confirmMembershipPayment(
      {
        associateId: "asc_01",
        competenceYear: 2026,
        competenceMonth: 5,
      },
      new Date(paidAt),
    );

    expect(payment).toMatchObject({
      associateId: "asc_01",
      competenceYear: 2026,
      competenceMonth: 5,
      paidAt,
    });
  });

  it("blocks duplicate payment for the same competence", async () => {
    const paidAt = new Date("2026-08-10T14:30:00.000Z");

    await service.confirmMembershipPayment(
      {
        associateId: "asc_01",
        competenceYear: 2026,
        competenceMonth: 5,
      },
      paidAt,
    );

    await expect(
      service.confirmMembershipPayment(
        {
          associateId: "asc_01",
          competenceYear: 2026,
          competenceMonth: 5,
        },
        paidAt,
      ),
    ).rejects.toThrow(MembershipFeeConflictError);
  });

  it("allows paying multiple overdue competences on the same day", async () => {
    const paidAt = new Date("2026-08-10T14:30:00.000Z");

    await Promise.all([
      service.confirmMembershipPayment(
        {
          associateId: "asc_01",
          competenceYear: 2026,
          competenceMonth: 5,
        },
        paidAt,
      ),
      service.confirmMembershipPayment(
        {
          associateId: "asc_01",
          competenceYear: 2026,
          competenceMonth: 6,
        },
        paidAt,
      ),
      service.confirmMembershipPayment(
        {
          associateId: "asc_01",
          competenceYear: 2026,
          competenceMonth: 7,
        },
        paidAt,
      ),
    ]);

    const payments = await repository.findPaymentsByAssociateId("asc_01");
    const augustBatch = payments.filter((payment) => payment.paidAt === paidAt.toISOString());

    expect(augustBatch).toHaveLength(3);
    expect(
      augustBatch.map((payment) => `${payment.competenceMonth}/${payment.competenceYear}`),
    ).toEqual(["5/2026", "6/2026", "7/2026"]);
  });

  it("allows paying a future month in advance", async () => {
    const paidAt = new Date("2026-05-10T14:30:00.000Z");

    await service.confirmMembershipPayment(
      {
        associateId: "asc_01",
        competenceYear: 2026,
        competenceMonth: 6,
      },
      paidAt,
    );

    const sheetView = await service.getMembershipFeeSheet("asc_01", 2026, paidAt);
    const june = sheetView.months.find((month) => month.month === 6);

    expect(june).toMatchObject({
      status: "paid",
      canConfirmPayment: false,
      paidAt: paidAt.toISOString(),
    });
    expect(sheetView.summary.totalOverdueMonths).toBe(4);
    expect(sheetView.summary.futureMonths).toBe(6);
  });

  it("allows paying the current month", async () => {
    const paidAt = new Date("2026-05-10T14:30:00.000Z");

    await service.confirmMembershipPayment(
      {
        associateId: "asc_01",
        competenceYear: 2026,
        competenceMonth: 5,
      },
      paidAt,
    );

    const sheetView = await service.getMembershipFeeSheet("asc_01", 2026, paidAt);
    const may = sheetView.months.find((month) => month.month === 5);

    expect(may).toMatchObject({
      status: "paid",
      canConfirmPayment: false,
      paidAt: paidAt.toISOString(),
    });
    expect(sheetView.summary.currentOpenMonths).toBe(0);
    expect(sheetView.summary.totalOverdueMonths).toBe(4);
  });

  it("allows paying an overdue month and preserves other overdue months", async () => {
    const paidAt = new Date("2026-05-10T14:30:00.000Z");

    await service.confirmMembershipPayment(
      {
        associateId: "asc_01",
        competenceYear: 2026,
        competenceMonth: 2,
      },
      paidAt,
    );

    const sheetView = await service.getMembershipFeeSheet("asc_01", 2026, paidAt);
    const february = sheetView.months.find((month) => month.month === 2);
    const january = sheetView.months.find((month) => month.month === 1);

    expect(february).toMatchObject({
      status: "paid",
      canConfirmPayment: false,
      paidAt: paidAt.toISOString(),
    });
    expect(january?.status).toBe("critical_overdue");
    expect(sheetView.summary.totalOverdueMonths).toBe(3);
  });

  it("removes only the selected payment when reversing and keeps the sheet", async () => {
    const paidAt = new Date("2026-05-10T14:30:00.000Z");

    await service.confirmMembershipPayment(
      {
        associateId: "asc_01",
        competenceYear: 2026,
        competenceMonth: 2,
      },
      paidAt,
    );
    await service.confirmMembershipPayment(
      {
        associateId: "asc_01",
        competenceYear: 2026,
        competenceMonth: 5,
      },
      paidAt,
    );

    await service.reverseMembershipPayment({
      associateId: "asc_01",
      competenceYear: 2026,
      competenceMonth: 2,
    });

    const sheetView = await service.getMembershipFeeSheet("asc_01", 2026, paidAt);
    const february = sheetView.months.find((month) => month.month === 2);
    const may = sheetView.months.find((month) => month.month === 5);
    const payments = await repository.findPaymentsByAssociateId("asc_01");
    const years = await repository.listSheetYearsByAssociateId("asc_01");

    expect(february?.status).toBe("critical_overdue");
    expect(may?.status).toBe("paid");
    expect(payments).toHaveLength(1);
    expect(payments[0]).toMatchObject({
      competenceMonth: 5,
      competenceYear: 2026,
    });
    expect(years).toEqual([2026]);
  });

  it("allows paying the same competence again after reversing", async () => {
    const paidAt = new Date("2026-05-10T14:30:00.000Z");
    const repaidAt = new Date("2026-05-11T09:15:00.000Z");

    await service.confirmMembershipPayment(
      {
        associateId: "asc_01",
        competenceYear: 2026,
        competenceMonth: 6,
      },
      paidAt,
    );
    await service.reverseMembershipPayment({
      associateId: "asc_01",
      competenceYear: 2026,
      competenceMonth: 6,
    });
    const payment = await service.confirmMembershipPayment(
      {
        associateId: "asc_01",
        competenceYear: 2026,
        competenceMonth: 6,
      },
      repaidAt,
    );

    const sheetView = await service.getMembershipFeeSheet("asc_01", 2026, repaidAt);
    const june = sheetView.months.find((month) => month.month === 6);

    expect(payment.paidAt).toBe(repaidAt.toISOString());
    expect(june?.status).toBe("paid");
  });

  it("recalculates the month status correctly after reversing a paid competence", async () => {
    const currentDate = new Date("2026-05-10T14:30:00.000Z");

    await service.confirmMembershipPayment(
      {
        associateId: "asc_01",
        competenceYear: 2026,
        competenceMonth: 7,
      },
      currentDate,
    );
    await service.confirmMembershipPayment(
      {
        associateId: "asc_01",
        competenceYear: 2026,
        competenceMonth: 5,
      },
      currentDate,
    );
    await service.confirmMembershipPayment(
      {
        associateId: "asc_01",
        competenceYear: 2026,
        competenceMonth: 4,
      },
      currentDate,
    );

    await service.reverseMembershipPayment({
      associateId: "asc_01",
      competenceYear: 2026,
      competenceMonth: 7,
    });
    await service.reverseMembershipPayment({
      associateId: "asc_01",
      competenceYear: 2026,
      competenceMonth: 5,
    });
    await service.reverseMembershipPayment({
      associateId: "asc_01",
      competenceYear: 2026,
      competenceMonth: 4,
    });

    const sheetView = await service.getMembershipFeeSheet("asc_01", 2026, currentDate);
    const april = sheetView.months.find((month) => month.month === 4);
    const may = sheetView.months.find((month) => month.month === 5);
    const july = sheetView.months.find((month) => month.month === 7);

    expect(april?.status).toBe("critical_overdue");
    expect(may?.status).toBe("current_open");
    expect(july?.status).toBe("future");
    expect(sheetView.summary.paidMonths).toBe(0);
    expect(sheetView.summary.currentOpenMonths).toBe(1);
    expect(sheetView.summary.futureMonths).toBe(7);
    expect(sheetView.summary.totalOverdueMonths).toBe(4);
    expect(sheetView.chargeEligible).toBe(true);
  });

  it("marks the current month as open and not overdue", async () => {
    const sheetView = await service.getOrCreateCurrentSheet(
      "asc_01",
      new Date("2026-07-15T12:00:00.000Z"),
    );
    const july = sheetView.months.find((month) => month.month === 7);

    expect(july?.status).toBe("current_open");
    expect(sheetView.summary.currentOpenMonths).toBe(1);
  });

  it("keeps future months out of debt calculations", async () => {
    const sheetView = await service.getOrCreateCurrentSheet(
      "asc_01",
      new Date("2026-07-15T12:00:00.000Z"),
    );
    const august = sheetView.months.find((month) => month.month === 8);

    expect(august?.status).toBe("future");
    expect(august?.canConfirmPayment).toBe(true);
    expect(sheetView.summary.futureMonths).toBe(5);
  });

  it("keeps a future month paid without turning it into debt and preserves previous overdue months", async () => {
    const currentDate = new Date("2026-05-10T14:30:00.000Z");

    await service.confirmMembershipPayment(
      {
        associateId: "asc_01",
        competenceYear: 2026,
        competenceMonth: 7,
      },
      currentDate,
    );

    const sheetView = await service.getMembershipFeeSheet("asc_01", 2026, currentDate);
    const july = sheetView.months.find((month) => month.month === 7);
    const april = sheetView.months.find((month) => month.month === 4);

    expect(july?.status).toBe("paid");
    expect(april?.status).toBe("critical_overdue");
    expect(sheetView.summary.totalOverdueMonths).toBe(4);
    expect(sheetView.summary.futureMonths).toBe(6);
  });

  it("marks previous unpaid months as overdue", async () => {
    const sheetView = await service.getOrCreateCurrentSheet(
      "asc_01",
      new Date("2026-02-10T12:00:00.000Z"),
    );
    const january = sheetView.months.find((month) => month.month === 1);

    expect(january?.status).toBe("overdue");
    expect(sheetView.summary.totalOverdueMonths).toBe(1);
  });

  it("marks overdue months as critical when there are three or more debits", async () => {
    const sheetView = await service.getOrCreateCurrentSheet(
      "asc_01",
      new Date("2026-07-15T12:00:00.000Z"),
    );

    expect(
      sheetView.months
        .filter((month) => month.month <= 6)
        .every((month) => month.status === "critical_overdue"),
    ).toBe(true);
    expect(sheetView.summary.criticalMonths).toBe(6);
  });

  it("releases the charge message only when there are at least two overdue months", async () => {
    await service.getOrCreateCurrentSheet("asc_01", new Date("2026-02-10T12:00:00.000Z"));
    const oneOverdue = await service.getChargeMessage(
      "asc_01",
      new Date("2026-02-10T12:00:00.000Z"),
    );
    await service.getOrCreateCurrentSheet("asc_01", new Date("2026-07-15T12:00:00.000Z"));
    const manyOverdue = await service.getChargeMessage(
      "asc_01",
      new Date("2026-07-15T12:00:00.000Z"),
    );

    expect(oneOverdue.allowed).toBe(false);
    expect(oneOverdue.message).toBeNull();
    expect(manyOverdue.allowed).toBe(true);
    expect(manyOverdue.message).toContain("Sr(a).");
    expect(manyOverdue.message).toContain("mensalidade junto ao Sindicato");
  });

  it("builds overview counts for 1, 2 and 3+ overdue months", async () => {
    const currentDate = new Date("2026-04-15T12:00:00.000Z");
    await prepareOverviewFixture(service, currentDate);

    const overview = await service.listMembershipFeeOverview({}, currentDate);

    expect(overview.totalAssociates).toBe(4);
    expect(overview.filteredAssociates).toBe(4);
    expect(overview.counts).toEqual({
      upToDate: 1,
      oneOverdue: 1,
      twoOverdue: 1,
      threePlusOverdue: 1,
    });
    expect(
      overview.entries.map((entry) => [entry.associateId, entry.overdueMonths, entry.statusLabel]),
    ).toEqual([
      ["asc_01", 3, "3+ meses vencidos"],
      ["asc_02", 2, "2 meses vencidos"],
      ["asc_03", 1, "1 mes vencido"],
      ["asc_04", 0, "Mes atual em aberto"],
    ]);
  });

  it("filters the overview by associate name", async () => {
    const currentDate = new Date("2026-04-15T12:00:00.000Z");
    await prepareOverviewFixture(service, currentDate);

    const overview = await service.listMembershipFeeOverview(
      {
        search: "maria",
      },
      currentDate,
    );

    expect(overview.filteredAssociates).toBe(1);
    expect(overview.entries.map((entry) => entry.associateId)).toEqual(["asc_01"]);
    expect(overview.counts.threePlusOverdue).toBe(1);
  });

  it("filters the overview by category", async () => {
    const currentDate = new Date("2026-04-15T12:00:00.000Z");
    await prepareOverviewFixture(service, currentDate);

    const overview = await service.listMembershipFeeOverview(
      {
        category: "ESCOLAR",
      },
      currentDate,
    );

    expect(overview.filteredAssociates).toBe(1);
    expect(overview.entries[0]).toMatchObject({
      associateId: "asc_02",
      category: "ESCOLAR",
      overdueMonths: 2,
    });
    expect(overview.counts.twoOverdue).toBe(1);
  });

  it("filters the overview by financial status without counting the current month as overdue", async () => {
    const currentDate = new Date("2026-04-15T12:00:00.000Z");
    await prepareOverviewFixture(service, currentDate);

    const twoOverdue = await service.listMembershipFeeOverview(
      {
        status: "two_overdue",
      },
      currentDate,
    );
    const upToDate = await service.listMembershipFeeOverview(
      {
        status: "up_to_date",
      },
      currentDate,
    );

    expect(twoOverdue.entries.map((entry) => entry.associateId)).toEqual(["asc_02"]);
    expect(upToDate.entries.map((entry) => entry.associateId)).toEqual(["asc_04"]);
    expect(upToDate.entries[0]?.statusLabel).toBe("Mes atual em aberto");
  });

  it("does not create current-year sheets while listing the overview", async () => {
    const currentDate = new Date("2026-04-15T12:00:00.000Z");
    const before = await countSheetsForAssociate("asc_01");

    await service.listMembershipFeeOverview({}, currentDate);

    const after = await countSheetsForAssociate("asc_01");

    expect(after).toBe(before);
  });

  it("does not create document rows or document alerts when handling membership payments", async () => {
    const dataLayer = createDataLayer();
    const [documentsBefore, alertsBefore] = await Promise.all([
      dataLayer.documents.findByAssociateId("asc_01"),
      dataLayer.alerts.countRelevant(),
    ]);

    await service.confirmMembershipPayment(
      {
        associateId: "asc_01",
        competenceYear: 2026,
        competenceMonth: 5,
      },
      new Date("2026-08-10T14:30:00.000Z"),
    );

    const [documentsAfter, alertsAfter] = await Promise.all([
      dataLayer.documents.findByAssociateId("asc_01"),
      dataLayer.alerts.countRelevant(),
    ]);

    expect(documentsAfter).toEqual(documentsBefore);
    expect(alertsAfter).toBe(alertsBefore);
  });

  it("returns a friendly not-found error when trying to reverse a competence without payment", async () => {
    await expect(
      service.reverseMembershipPayment({
        associateId: "asc_01",
        competenceYear: 2026,
        competenceMonth: 9,
      }),
    ).rejects.toMatchObject({
      name: "MembershipFeeNotFoundError",
      message: "MEMBERSHIP_FEE_PAYMENT_NOT_FOUND",
    });
  });
});

async function countSheetsForAssociate(associateId: string) {
  return withSqliteDatabase((db) => {
    return (
      Number(
        db.exec(
          "SELECT COUNT(*) FROM membership_fee_sheets WHERE associate_id = ?",
          [associateId],
        )[0]?.values?.[0]?.[0],
      ) || 0
    );
  });
}

async function prepareOverviewFixture(
  service: ReturnType<typeof createMembershipFeeService>,
  currentDate: Date,
) {
  await service.confirmMembershipPayment(
    {
      associateId: "asc_02",
      competenceYear: 2026,
      competenceMonth: 1,
    },
    currentDate,
  );

  await service.confirmMembershipPayment(
    {
      associateId: "asc_03",
      competenceYear: 2026,
      competenceMonth: 1,
    },
    currentDate,
  );
  await service.confirmMembershipPayment(
    {
      associateId: "asc_03",
      competenceYear: 2026,
      competenceMonth: 2,
    },
    currentDate,
  );

  await service.confirmMembershipPayment(
    {
      associateId: "asc_04",
      competenceYear: 2026,
      competenceMonth: 1,
    },
    currentDate,
  );
  await service.confirmMembershipPayment(
    {
      associateId: "asc_04",
      competenceYear: 2026,
      competenceMonth: 2,
    },
    currentDate,
  );
  await service.confirmMembershipPayment(
    {
      associateId: "asc_04",
      competenceYear: 2026,
      competenceMonth: 3,
    },
    currentDate,
  );
}

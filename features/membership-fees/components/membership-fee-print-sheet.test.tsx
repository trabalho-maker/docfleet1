import { renderToStaticMarkup } from "react-dom/server";
import { MembershipFeePrintSheet } from "@/features/membership-fees/components/membership-fee-print-sheet";
import type { MembershipFeeSheetView } from "@/features/membership-fees/types";

const sheetViewFixture: MembershipFeeSheetView = {
  associate: {
    id: "asc_print_membership_01",
    name: "Maria de Souza",
    registrationNumber: "MAT-2026-9012",
    displayName: "Maria de Souza",
    displayAddress: "Rua 1, 200 - Centro",
    displayCategory: "Táxi",
    displayPhone: "(19) 3522-0001",
    displayRegistrationSuffix: "9012",
    displayInss: null,
  },
  sheet: {
    id: "sheet_2026_01",
    associateId: "asc_print_membership_01",
    referenceYear: 2026,
    status: "active",
    snapshotName: "Maria de Souza",
    snapshotAddress: "Rua 1, 200 - Centro",
    snapshotCategory: "Táxi",
    snapshotPhone: "(19) 3522-0001",
    snapshotRegistrationSuffix: "9012",
    snapshotInss: null,
    createdAt: "2026-05-06T08:00:00.000Z",
    updatedAt: "2026-05-06T08:00:00.000Z",
  },
  payments: [
    {
      id: "pay_01",
      sheetId: "sheet_2026_01",
      associateId: "asc_print_membership_01",
      competenceYear: 2026,
      competenceMonth: 1,
      paidAt: "2026-01-10T12:00:00.000Z",
      paidByUserId: "user_01",
      notes: null,
      createdAt: "2026-01-10T12:00:00.000Z",
      updatedAt: "2026-01-10T12:00:00.000Z",
    },
  ],
  months: Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    monthLabel: `Mês ${index + 1}`,
    competenceLabel: `${String(index + 1).padStart(2, "0")}/2026`,
    status: index === 0 ? "paid" : "future",
    paidAt: index === 0 ? "2026-01-10T12:00:00.000Z" : null,
    canConfirmPayment: index !== 0,
  })),
  availableYears: [2026],
  summary: {
    paidMonths: 1,
    currentOpenMonths: 1,
    futureMonths: 10,
    overdueMonths: 0,
    criticalMonths: 0,
    totalOverdueMonths: 0,
  },
  chargeMessage: null,
  chargeEligible: false,
};

describe("membership fee print sheet", () => {
  it("renders a printable physical layout with all 12 competencies", () => {
    const markup = renderToStaticMarkup(
      <MembershipFeePrintSheet sheetView={sheetViewFixture} logoSrc={null} />,
    );

    expect(markup).toContain("FICHA DE MENSALIDADES");
    expect(markup).toContain("SINTRARC");
    expect(markup).toContain("12/2026");
    expect(markup).toContain("01/2026");
    expect(markup).toContain("Nome");
    expect(markup).toContain("Endereço");
    expect(markup).toContain("Ano vigente");
    expect(markup).toContain("N\u00ba (Matrícula)");
    expect(markup).toContain("N\u00ba 9012");
    expect(markup.match(/____\/____\/____/g)).toHaveLength(12);
    expect(markup).toContain("9012");
    expect(markup.indexOf("12/2026")).toBeLessThan(markup.indexOf("01/2026"));
  });

  it("keeps empty fields visually stable and does not depend on digital payment status", () => {
    const markup = renderToStaticMarkup(
      <MembershipFeePrintSheet
        sheetView={{
          ...sheetViewFixture,
          associate: {
            ...sheetViewFixture.associate,
            displayAddress: null,
            displayPhone: null,
            displayCategory: null,
            displayRegistrationSuffix: null,
            displayInss: null,
          },
        }}
        logoSrc={null}
      />,
    );

    expect(markup).toContain("Não informado");
    expect(markup).not.toContain("Pago");
    expect(markup).toContain("____/____/____");
  });
});

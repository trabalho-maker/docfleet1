import { summarizeDocumentsByDueDate } from "@/features/documents/lib/document-due-summary";
import type { FleetDocument } from "@/features/data/types";

describe("document due summary", () => {
  const documents: FleetDocument[] = [
    {
      id: "doc-expired",
      name: "CNH",
      owner: "Operacao",
      documentType: "CNH",
      status: "Vencido",
      dueDate: "2026-04-01",
      associateId: "asc_01",
      associateName: "Maria",
      associateRegistrationNumber: "MAT-1",
      associateCategory: "TAXI",
      notes: null,
    },
    {
      id: "doc-15",
      name: "Toxicologico",
      owner: "Operacao",
      documentType: "TOXICOLOGICO",
      status: "Atencao",
      dueDate: "2026-04-18",
      associateId: "asc_02",
      associateName: "Joao",
      associateRegistrationNumber: "MAT-2",
      associateCategory: "ESCOLAR",
      notes: null,
    },
    {
      id: "doc-30",
      name: "Tacografo",
      owner: "Operacao",
      documentType: "TACOGRAFO",
      status: "Atencao",
      dueDate: "2026-05-05",
      associateId: "asc_03",
      associateName: "Ana",
      associateRegistrationNumber: "MAT-3",
      associateCategory: "CAMINHAO",
      notes: null,
    },
  ];

  it("groups documents into expired, up to 15 days and 16 to 30 days", () => {
    const summary = summarizeDocumentsByDueDate(
      documents,
      new Date("2026-04-08T12:00:00Z"),
    );

    expect(summary).toEqual({
      total: 3,
      expired: 1,
      dueIn15Days: 1,
      dueIn30Days: 1,
    });
  });
});

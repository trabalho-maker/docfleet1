import {
  resetSqliteDatabase,
  resetSqliteStorageState,
} from "@/lib/storage/sqlite-storage";
import { SqliteAssociateRepository } from "@/src/features/associates/server/associate.repository";
import {
  AssociateConflictError,
  AssociateNotFoundError,
  createAssociateService,
} from "@/src/features/associates/server/associate.service";

describe("associate service", () => {
  const repository = new SqliteAssociateRepository();
  const service = createAssociateService({ repository });

  beforeEach(async () => {
    await resetSqliteStorageState();
    await resetSqliteDatabase();
  });

  afterAll(async () => {
    await resetSqliteStorageState();
  });

  it("creates an associate with normalized CPF", async () => {
    const created = await service.createAssociate({
      name: "Carlos Alberto",
      cpf: "529.982.247-25",
      category: "Titular",
      registrationNumber: "MAT-2026-0100",
      status: "Ativo",
      admissionDate: "2025-03-20",
    });

    expect(created.cpf).toBe("52998224725");
    expect(created.registrationNumber).toBe("MAT-2026-0100");
  });

  it("rejects duplicate CPF on create", async () => {
    await expect(
      service.createAssociate({
        name: "Outra Maria",
        cpf: "390.533.447-05",
        category: "Titular",
        registrationNumber: "MAT-2026-0200",
        status: "Ativo",
        admissionDate: "2024-06-01",
      }),
    ).rejects.toThrow(AssociateConflictError);
  });

  it("updates an existing associate", async () => {
    const updated = await service.updateAssociate("asc_01", {
      name: "Maria de Souza Lima",
      status: "Inativo",
    });

    expect(updated.name).toBe("Maria de Souza Lima");
    expect(updated.status).toBe("Inativo");
  });

  it("deletes an existing associate", async () => {
    await service.deleteAssociate("asc_03");

    await expect(service.getAssociateById("asc_03")).rejects.toThrow(
      AssociateNotFoundError,
    );
  });

  it("filters associates by search, CPF, category and status", async () => {
    const byName = await service.listAssociates({ search: "Maria" });
    const byCpf = await service.listAssociates({ search: "390.533.447-05" });
    const byCategoryAndStatus = await service.listAssociates({
      category: "Contribuinte",
      status: "Suspenso",
    });

    expect(byName).toHaveLength(1);
    expect(byName[0]?.id).toBe("asc_01");
    expect(byCpf).toHaveLength(1);
    expect(byCpf[0]?.id).toBe("asc_01");
    expect(byCategoryAndStatus).toHaveLength(1);
    expect(byCategoryAndStatus[0]?.id).toBe("asc_02");
  });
});

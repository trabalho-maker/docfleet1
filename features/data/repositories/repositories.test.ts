import { existsSync } from "node:fs";
import bcrypt from "bcryptjs";
import { SqliteUserRepository } from "@/features/data/repositories/user-repository";
import { SqliteDocumentRepository } from "@/features/data/repositories/document-repository";
import { SqliteAlertRepository } from "@/features/data/repositories/alert-repository";
import { SqlitePasswordResetTokenRepository } from "@/features/data/repositories/password-reset-token-repository";
import { SqliteAuthRateLimitRepository } from "@/features/data/repositories/auth-rate-limit-repository";
import {
  resetSqliteDatabase,
  resetSqliteStorageState,
  withSqliteWriteLock,
} from "@/lib/storage/sqlite-storage";
import { createSqliteSchema } from "@/lib/storage/sqlite-schema";
import { getSqliteDatabasePath } from "@/lib/server/runtime-paths";

jest.setTimeout(15000);

describe("repositories", () => {
  const userRepository = new SqliteUserRepository();
  const documentRepository = new SqliteDocumentRepository();
  const alertRepository = new SqliteAlertRepository();
  const passwordResetTokenRepository = new SqlitePasswordResetTokenRepository();
  const authRateLimitRepository = new SqliteAuthRateLimitRepository();

  beforeEach(async () => {
    await resetSqliteStorageState();
    await resetSqliteDatabase();
  });

  afterAll(async () => {
    await resetSqliteStorageState();
  });

  it("creates a user with normalized email and hashed password", async () => {
    const user = await userRepository.create({
      name: "Maria da Silva",
      email: " Maria@DocFleet.Local ",
      password: "Senha123",
    });

    expect(user.email).toBe("maria@docfleet.local");
    expect(user.role).toBe("Operador");
    expect(user.passwordHash).not.toBe("Senha123");
    await expect(bcrypt.compare("Senha123", user.passwordHash)).resolves.toBe(
      true,
    );
  });

  it("keeps SQLite foreign keys enabled in the runtime connection", async () => {
    await withSqliteWriteLock((db) => {
      const foreignKeysEnabled = Number(
        db.exec("PRAGMA foreign_keys")[0]?.values?.[0]?.[0] ?? 0,
      );

      expect(foreignKeysEnabled).toBe(1);
    });
  });

  it("persists data in a physical SQLite file for the active runtime", async () => {
    expect(existsSync(getSqliteDatabasePath())).toBe(true);
  });

  it("records the schema version and avoids rerunning legacy rebuild flow on repeated bootstrap", async () => {
    await withSqliteWriteLock((db) => {
      const before = Number(
        db.exec("SELECT COUNT(*) FROM documents")[0]?.values?.[0]?.[0] ?? 0,
      );

      createSqliteSchema(db);

      const after = Number(
        db.exec("SELECT COUNT(*) FROM documents")[0]?.values?.[0]?.[0] ?? 0,
      );
      const version = Number(
        db.exec(
          "SELECT version FROM app_schema_version WHERE id = 1 LIMIT 1",
        )[0]?.values?.[0]?.[0] ?? 0,
      );

      expect(after).toBe(before);
      expect(version).toBe(2);
    });
  });

  it("rejects duplicate users by email", async () => {
    await expect(
      userRepository.create({
        name: "Outro Usuario",
        email: "operacoes@docfleet.local",
        password: "Senha123",
      }),
    ).rejects.toThrow("USER_ALREADY_EXISTS");
  });

  it("returns structured documents ordered by due date", async () => {
    const documents = await documentRepository.listRecent();
    const allDocuments = await documentRepository.listAll();
    const totalDocuments = await documentRepository.countAll();
    const pendingDocuments = await documentRepository.countPending();

    expect(documents).toHaveLength(3);
    expect(allDocuments).toHaveLength(3);
    expect(documents.map((item) => item.id)).toEqual([
      "doc_03",
      "doc_01",
      "doc_02",
    ]);
    expect(documents[0]).toMatchObject({
      documentType: "AUTORIZACAO_CONDUTOR",
      associateId: "asc_03",
      associateCategory: "CAMINHAO",
    });
    expect(totalDocuments).toBe(3);
    expect(pendingDocuments).toBe(2);
  });

  it("filters structured documents by associate category", async () => {
    const taxistaDocuments = await documentRepository.listAll({
      category: "TAXI",
    });

    expect(taxistaDocuments).toHaveLength(1);
    expect(taxistaDocuments[0]).toMatchObject({
      id: "doc_01",
      associateId: "asc_01",
      documentType: "CNH",
      associateCategory: "TAXI",
    });
  });

  it("lists only documents linked to the requested associates and types", async () => {
    const documents = await documentRepository.listByAssociateIds(
      ["asc_01", "asc_03"],
      {
        documentTypes: ["CNH"],
      },
    );

    expect(documents).toHaveLength(1);
    expect(documents[0]).toMatchObject({
      id: "doc_01",
      associateId: "asc_01",
      documentType: "CNH",
    });
  });

  it("groups documents by calculated status in SQL for dashboard usage", async () => {
    const allDocuments = await documentRepository.listAll();
    const grouped = await documentRepository.groupByType(new Date(), 5);

    const expected = allDocuments
      .reduce<
        Array<{
          documentType: string;
          valid: number;
          attention: number;
          expired: number;
          total: number;
        }>
      >((accumulator, document) => {
        const existing = accumulator.find((item) => item.documentType === document.documentType);

        if (existing) {
          existing.total += 1;

          if (document.status === "Valido") {
            existing.valid += 1;
          } else if (document.status === "Atencao") {
            existing.attention += 1;
          } else {
            existing.expired += 1;
          }

          return accumulator;
        }

        accumulator.push({
          documentType: document.documentType,
          valid: document.status === "Valido" ? 1 : 0,
          attention: document.status === "Atencao" ? 1 : 0,
          expired: document.status === "Vencido" ? 1 : 0,
          total: 1,
        });

        return accumulator;
      }, [])
      .sort(
        (left, right) =>
          right.total - left.total ||
          left.documentType.localeCompare(right.documentType),
      )
      .slice(0, 5);

    expect(grouped).toEqual(expected);
  });

  it("summarizes the expiration timeline in SQL for dashboard usage", async () => {
    const allDocuments = await documentRepository.listAll();
    const now = new Date();
    const timeline = await documentRepository.summarizeExpirationTimeline(now);
    const expected = new Map<string, number>();

    for (let index = -2; index <= 4; index += 1) {
      const date = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + index, 1),
      );
      const bucket = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
      expected.set(bucket, 0);
    }

    for (const document of allDocuments) {
      const bucket = document.dueDate.slice(0, 7);

      if (expected.has(bucket)) {
        expected.set(bucket, (expected.get(bucket) ?? 0) + 1);
      }
    }

    expect(timeline).toEqual(
      Array.from(expected.entries())
        .filter(([, total]) => total > 0)
        .map(([bucket, total]) => ({
          bucket,
          total,
        })),
    );
  });

  it("consolidates legacy duplicates before enforcing associate/type uniqueness", async () => {
    await withSqliteWriteLock(async (db) => {
      db.run("DELETE FROM app_schema_version");
      db.run("DROP TABLE IF EXISTS documents");
      db.run(`
        CREATE TABLE documents (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          owner TEXT NOT NULL,
          type TEXT NOT NULL,
          status TEXT NOT NULL,
          due_date TEXT NOT NULL,
          associate_id TEXT,
          notes TEXT
        )
      `);
      db.run(
        `INSERT INTO documents (
          id,
          name,
          owner,
          type,
          status,
          due_date,
          associate_id,
          notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "legacy_doc_old",
          "CNH",
          "Equipe A",
          "CNH",
          "Atencao",
          "2026-05-01",
          "asc_01",
          "",
        ],
      );
      db.run(
        `INSERT INTO documents (
          id,
          name,
          owner,
          type,
          status,
          due_date,
          associate_id,
          notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "legacy_doc_new",
          "CNH",
          "Equipe B",
          "CNH",
          "Valido",
          "2026-06-01",
          "asc_01",
          "Registro mais completo.",
        ],
      );

      createSqliteSchema(db);
    });

    const deduplicated = await documentRepository.findByAssociateAndType("asc_01", "CNH");
    const rows = await documentRepository.findByAssociateId("asc_01", {
      documentTypes: ["CNH"],
    });

    expect(rows).toHaveLength(1);
    expect(deduplicated).toMatchObject({
      id: "legacy_doc_new",
      owner: "Equipe B",
      dueDate: "2026-06-01",
      notes: "Registro mais completo.",
    });
  });

  it("normalizes legacy RG, CNH and company CNPJ values during schema bootstrap", async () => {
    await withSqliteWriteLock((db) => {
      db.run("DELETE FROM app_schema_version");
      db.run(
        `
          UPDATE associate_profiles
          SET
            rg = ?,
            cnh = ?,
            cnpj_empresa = ?
          WHERE associate_id = ?
        `,
        [" 28.456.789-x ", " 0123 4567-890 ", null, "asc_01"],
      );
      db.run(
        `
          UPDATE associate_profiles
          SET cnh = ?
          WHERE associate_id = ?
        `,
        [" 0099 8877-665 ", "asc_02"],
      );
      db.run(
        `
          UPDATE associate_profiles
          SET cnpj_empresa = ?
          WHERE associate_id = ?
        `,
        ["27.865.757/0001-02", "asc_04"],
      );

      createSqliteSchema(db);

      const rows = db.exec(
        `
          SELECT associate_id, rg, cnh, cnpj_empresa
          FROM associate_profiles
          WHERE associate_id IN (?, ?, ?)
          ORDER BY associate_id ASC
        `,
        ["asc_01", "asc_02", "asc_04"],
      )[0]?.values;

      expect(rows).toEqual([
        ["asc_01", "28456789X", "01234567890", null],
        ["asc_02", "192234561", "00998877665", null],
        ["asc_04", null, null, "27865757000102"],
      ]);
    });
  });

  it("fails schema bootstrap with a clear error when RG duplicates remain after normalization", async () => {
    await withSqliteWriteLock((db) => {
      db.run("DELETE FROM app_schema_version");
      db.run("DROP INDEX IF EXISTS idx_associate_profiles_rg_unique_non_empty");
      db.run("DROP INDEX IF EXISTS idx_associate_profiles_cnh_unique_non_empty");
      db.run("DROP INDEX IF EXISTS idx_associate_profiles_cnpj_empresa_unique_non_empty");
      db.run(
        `
          INSERT INTO associates (
            id,
            name,
            cpf,
            category,
            registration_number,
            status,
            admission_date,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          "asc_dup_rg",
          "Associado Duplicado RG",
          "52998224725",
          "Titular",
          "MAT-2026-0999",
          "Ativo",
          "2025-01-10",
          "2026-04-06T08:15:00.000Z",
          "2026-04-06T08:15:00.000Z",
        ],
      );
      db.run(
        `
          INSERT INTO associate_profiles (
            associate_id,
            rg,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?)
        `,
        [
          "asc_dup_rg",
          "28.456.789-0",
          "2026-04-06T08:15:00.000Z",
          "2026-04-06T08:15:00.000Z",
        ],
      );

      try {
        createSqliteSchema(db);
        throw new Error("EXPECTED_SCHEMA_DUPLICATE_FAILURE");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain(
          "SQLITE_ASSOCIATE_PROFILE_RG_DUPLICATE",
        );
      } finally {
        db.run("DELETE FROM associate_profiles WHERE associate_id = ?", ["asc_dup_rg"]);
        db.run("DELETE FROM associates WHERE id = ?", ["asc_dup_rg"]);
        db.run("DELETE FROM app_schema_version");
        createSqliteSchema(db);
      }
    });
  });

  it("creates, updates and deletes a structured document linked to an associate", async () => {
    const created = await documentRepository.create({
      associateId: "asc_01",
      documentType: "TACOGRAFO",
      dueDate: "2099-05-10",
      owner: "Equipe Financeira",
      notes: "Primeiro cadastro estruturado.",
    });

    expect(created.documentType).toBe("TACOGRAFO");
    expect(created.associateId).toBe("asc_01");
    expect(created.status).toBe("Valido");

    const found = await documentRepository.findByAssociateAndType("asc_01", "TACOGRAFO");

    expect(found).not.toBeNull();
    expect(found?.owner).toBe("Equipe Financeira");
    expect(found?.associateName).toBe("Maria de Souza");

    const updated = await documentRepository.update(created.id, {
      dueDate: "2000-06-10",
      notes: "Documento vencido para teste.",
    });

    expect(updated.status).toBe("Vencido");
    expect(updated.notes).toBe("Documento vencido para teste.");

    await documentRepository.delete(created.id);

    const afterDelete = await documentRepository.findById(created.id);

    expect(afterDelete).toBeNull();
  });

  it("rejects documents linked to a non-existent associate when foreign keys are enabled", async () => {
    await expect(
      documentRepository.create({
        associateId: "asc_missing",
        documentType: "CNH",
        dueDate: "2099-05-10",
        owner: "Equipe Financeira",
      }),
    ).rejects.toThrow();
  });

  it("upserts an existing associate document instead of creating duplicates", async () => {
    const upserted = await documentRepository.create({
      associateId: "asc_01",
      documentType: "CNH",
      dueDate: "2099-08-15",
      owner: "Equipe de Cadastro",
      notes: "Atualizacao via upsert.",
    });
    const rows = await documentRepository.findByAssociateId("asc_01", {
      documentTypes: ["CNH"],
    });

    expect(rows).toHaveLength(1);
    expect(upserted).toMatchObject({
      id: "doc_01",
      owner: "Equipe de Cadastro",
      dueDate: "2099-08-15",
      notes: "Atualizacao via upsert.",
    });
  });

  it("rejects duplicate RG values through the partial unique index", async () => {
    await withSqliteWriteLock((db) => {
      db.run(
        `
          INSERT INTO associates (
            id,
            name,
            cpf,
            category,
            registration_number,
            status,
            admission_date,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          "asc_rg_index",
          "Associado RG",
          "52998224725",
          "Titular",
          "MAT-2026-0100",
          "Ativo",
          "2025-01-10",
          "2026-04-06T08:15:00.000Z",
          "2026-04-06T08:15:00.000Z",
        ],
      );

      expect(() =>
        db.run(
          `
            INSERT INTO associate_profiles (
              associate_id,
              rg,
              created_at,
              updated_at
            ) VALUES (?, ?, ?, ?)
          `,
          [
            "asc_rg_index",
            "284567890",
            "2026-04-06T08:15:00.000Z",
            "2026-04-06T08:15:00.000Z",
          ],
        ),
      ).toThrow();
    });
  });

  it("rejects duplicate CNH values through the partial unique index", async () => {
    await withSqliteWriteLock((db) => {
      db.run(
        `
          INSERT INTO associates (
            id,
            name,
            cpf,
            category,
            registration_number,
            status,
            admission_date,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          "asc_cnh_index",
          "Associado CNH",
          "11144477735",
          "Titular",
          "MAT-2026-0101",
          "Ativo",
          "2025-01-10",
          "2026-04-06T08:15:00.000Z",
          "2026-04-06T08:15:00.000Z",
        ],
      );

      expect(() =>
        db.run(
          `
            INSERT INTO associate_profiles (
              associate_id,
              cnh,
              created_at,
              updated_at
            ) VALUES (?, ?, ?, ?)
          `,
          [
            "asc_cnh_index",
            "01234567890",
            "2026-04-06T08:15:00.000Z",
            "2026-04-06T08:15:00.000Z",
          ],
        ),
      ).toThrow();
    });
  });

  it("rejects duplicate company CNPJ values through the partial unique index", async () => {
    await withSqliteWriteLock((db) => {
      db.run(
        `
          INSERT INTO associates (
            id,
            name,
            cpf,
            category,
            registration_number,
            status,
            admission_date,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          "asc_cnpj_index",
          "Associado CNPJ",
          "32699768006",
          "Titular",
          "MAT-2026-0102",
          "Ativo",
          "2025-01-10",
          "2026-04-06T08:15:00.000Z",
          "2026-04-06T08:15:00.000Z",
        ],
      );

      expect(() =>
        db.run(
          `
            INSERT INTO associate_profiles (
              associate_id,
              cnpj_empresa,
              created_at,
              updated_at
            ) VALUES (?, ?, ?, ?)
          `,
          [
            "asc_cnpj_index",
            "27865757000102",
            "2026-04-06T08:15:00.000Z",
            "2026-04-06T08:15:00.000Z",
          ],
        ),
      ).toThrow();
    });
  });

  it("allows multiple null and empty identifier values in associate profiles", async () => {
    await withSqliteWriteLock((db) => {
      db.run(
        `
          INSERT INTO associates (
            id,
            name,
            cpf,
            category,
            registration_number,
            status,
            admission_date,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          "asc_optional_a",
          "Associado Opcional A",
          "12345678909",
          "Titular",
          "MAT-2026-0200",
          "Ativo",
          "2025-01-10",
          "2026-04-06T08:15:00.000Z",
          "2026-04-06T08:15:00.000Z",
        ],
      );
      db.run(
        `
          INSERT INTO associates (
            id,
            name,
            cpf,
            category,
            registration_number,
            status,
            admission_date,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          "asc_optional_b",
          "Associado Opcional B",
          "12345678991",
          "Titular",
          "MAT-2026-0201",
          "Ativo",
          "2025-01-10",
          "2026-04-06T08:15:00.000Z",
          "2026-04-06T08:15:00.000Z",
        ],
      );
      db.run(
        `
          INSERT INTO associate_profiles (
            associate_id,
            rg,
            cnh,
            cnpj_empresa,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          "asc_optional_a",
          "",
          "",
          "",
          "2026-04-06T08:15:00.000Z",
          "2026-04-06T08:15:00.000Z",
        ],
      );
      db.run(
        `
          INSERT INTO associate_profiles (
            associate_id,
            rg,
            cnh,
            cnpj_empresa,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          "asc_optional_b",
          null,
          null,
          null,
          "2026-04-06T08:15:00.000Z",
          "2026-04-06T08:15:00.000Z",
        ],
      );

      const total = Number(
        db.exec(
          `
            SELECT COUNT(*)
            FROM associate_profiles
            WHERE associate_id IN (?, ?)
          `,
          ["asc_optional_a", "asc_optional_b"],
        )[0]?.values?.[0]?.[0] ?? 0,
      );

      expect(total).toBe(2);
    });
  });

  it("returns alerts ordered by most recent timestamp", async () => {
    const alerts = await alertRepository.listOpen();
    const totalAlerts = await alertRepository.countOpen();

    expect(alerts).toHaveLength(3);
    expect(alerts.map((item) => item.id)).toEqual([
      "alt_03",
      "alt_02",
      "alt_01",
    ]);
    expect(totalAlerts).toBe(3);
  });

  it("counts and lists only relevant dashboard alerts", async () => {
    await alertRepository.upsertGeneratedForDocument({
      title: "CNH de Maria vence hoje",
      severity: "Alta",
      team: "Origem documental",
      createdAt: "2026-04-09 10:00",
      sourceDocumentId: "doc_01",
      kind: "document_expiration",
    });

    await withSqliteWriteLock((db) => {
      db.run(
        `
          INSERT INTO alerts (
            id,
            title,
            severity,
            team,
            created_at,
            kind,
            source_document_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          "alt_operational",
          "Operacao aguardando ajuste de escala",
          "Media",
          "Operacao",
          "2026-04-10 08:15",
          "operational",
          null,
        ],
      );
    });

    const alerts = await alertRepository.listRelevant();
    const totalAlerts = await alertRepository.countRelevant();

    expect(alerts).toEqual([
      expect.objectContaining({
        title: "CNH de Maria vence hoje",
        kind: "document_expiration",
        sourceDocumentId: "doc_01",
      }),
      expect.objectContaining({
        id: "alt_operational",
        kind: "operational",
      }),
    ]);
    expect(alerts.every((item) => item.kind !== "manual")).toBe(true);
    expect(totalAlerts).toBe(2);
  });

  it("upserts generated alerts without duplicating the same source document", async () => {
    await alertRepository.upsertGeneratedForDocument({
      title: "CNH de Maria vence em 2 dias",
      severity: "Alta",
      team: "Origem documental",
      createdAt: "2026-04-08 10:00",
      sourceDocumentId: "doc_01",
      kind: "document_expiration",
    });
    await alertRepository.upsertGeneratedForDocument({
      title: "CNH de Maria vence hoje",
      severity: "Alta",
      team: "Origem documental",
      createdAt: "2026-04-09 10:00",
      sourceDocumentId: "doc_01",
      kind: "document_expiration",
    });

    const storedAlert = await alertRepository.findGeneratedBySourceDocumentId("doc_01");

    expect(storedAlert).toMatchObject({
      title: "CNH de Maria vence hoje",
      createdAt: "2026-04-09 10:00",
    });

    await withSqliteWriteLock((db) => {
      const duplicateCount = Number(
        db.exec(
          "SELECT COUNT(*) FROM alerts WHERE source_document_id = ?",
          ["doc_01"],
        )[0]?.values?.[0]?.[0] ?? 0,
      );

      expect(duplicateCount).toBe(1);
    });
  });

  it("creates and resolves a valid password reset token", async () => {
    const seededUser = await userRepository.findByEmail("operacoes@docfleet.local");

    expect(seededUser).not.toBeNull();

    const created = await passwordResetTokenRepository.createForUser(seededUser!);
    const resolved = await passwordResetTokenRepository.findValidByRawToken(
      created.token,
    );

    expect(resolved).not.toBeNull();
    expect(resolved?.user.email).toBe("operacoes@docfleet.local");
  });

  it("allows multiple active password reset tokens to coexist for the same user", async () => {
    const seededUser = await userRepository.findByEmail("operacoes@docfleet.local");

    expect(seededUser).not.toBeNull();

    const first = await passwordResetTokenRepository.createForUser(seededUser!);
    const second = await passwordResetTokenRepository.createForUser(seededUser!);

    const firstResolved = await passwordResetTokenRepository.findValidByRawToken(
      first.token,
    );
    const secondResolved = await passwordResetTokenRepository.findValidByRawToken(
      second.token,
    );

    expect(firstResolved).not.toBeNull();
    expect(secondResolved).not.toBeNull();
    expect(firstResolved?.id).not.toBe(secondResolved?.id);
  });

  it("consumes a password reset token after use", async () => {
    const seededUser = await userRepository.findByEmail("operacoes@docfleet.local");
    const created = await passwordResetTokenRepository.createForUser(seededUser!);
    const resolved = await passwordResetTokenRepository.findValidByRawToken(
      created.token,
    );

    expect(resolved).not.toBeNull();

    await passwordResetTokenRepository.consume(resolved!.id);

    const afterConsume = await passwordResetTokenRepository.findValidByRawToken(
      created.token,
    );

    expect(afterConsume).toBeNull();
  });

  it("can invalidate all remaining active reset tokens after one is used successfully", async () => {
    const seededUser = await userRepository.findByEmail("operacoes@docfleet.local");
    const first = await passwordResetTokenRepository.createForUser(seededUser!);
    const second = await passwordResetTokenRepository.createForUser(seededUser!);
    const resolvedFirst = await passwordResetTokenRepository.findValidByRawToken(
      first.token,
    );

    expect(resolvedFirst).not.toBeNull();

    await passwordResetTokenRepository.consume(resolvedFirst!.id);
    await passwordResetTokenRepository.deleteActiveForUser(seededUser!.id);

    const firstAfter = await passwordResetTokenRepository.findValidByRawToken(
      first.token,
    );
    const secondAfter = await passwordResetTokenRepository.findValidByRawToken(
      second.token,
    );

    expect(firstAfter).toBeNull();
    expect(secondAfter).toBeNull();
  });

  it("blocks login after multiple failed attempts", async () => {
    const policy = {
      windowMs: 15 * 60 * 1000,
      maxAttempts: 3,
      baseBlockDurationMs: 15 * 60 * 1000,
      maxBlockDurationMs: 15 * 60 * 1000,
    };

    await authRateLimitRepository.registerFailure(
      "login",
      "teste@docfleet.local",
      policy,
    );
    await authRateLimitRepository.registerFailure(
      "login",
      "teste@docfleet.local",
      policy,
    );
    const blocked = await authRateLimitRepository.registerFailure(
      "login",
      "teste@docfleet.local",
      policy,
    );

    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked.penaltyLevel).toBe(1);
  });

  it("clears login rate limit state after success path", async () => {
    const policy = {
      windowMs: 15 * 60 * 1000,
      maxAttempts: 3,
      baseBlockDurationMs: 15 * 60 * 1000,
      maxBlockDurationMs: 15 * 60 * 1000,
    };

    await authRateLimitRepository.registerFailure(
      "login",
      "teste@docfleet.local",
      policy,
    );
    await authRateLimitRepository.clear("login", "teste@docfleet.local");
    const state = await authRateLimitRepository.getState(
      "login",
      "teste@docfleet.local",
      policy,
    );

    expect(state.allowed).toBe(true);
    expect(state.attemptsRemaining).toBe(policy.maxAttempts);
  });

  it("applies progressive blocking with capped backoff without causing permanent lockout", async () => {
    const identifier = "progressive@docfleet.local";
    const policy = {
      windowMs: 60 * 1000,
      maxAttempts: 2,
      baseBlockDurationMs: 1000,
      maxBlockDurationMs: 4000,
    };

    await authRateLimitRepository.registerFailure("login", identifier, policy);
    const firstBlocked = await authRateLimitRepository.registerFailure(
      "login",
      identifier,
      policy,
    );

    expect(firstBlocked.allowed).toBe(false);
    expect(firstBlocked.penaltyLevel).toBe(1);

    await withSqliteWriteLock(async (db) => {
      db.run(
        `UPDATE auth_rate_limits
         SET blocked_until = ?, window_started_at = ?
         WHERE scope = ? AND identifier = ?`,
        [
          new Date(Date.now() - 1000).toISOString(),
          new Date(Date.now() - policy.windowMs - 1000).toISOString(),
          "login",
          identifier,
        ],
      );
    });

    await authRateLimitRepository.registerFailure("login", identifier, policy);
    const secondBlocked = await authRateLimitRepository.registerFailure(
      "login",
      identifier,
      policy,
    );

    expect(secondBlocked.allowed).toBe(false);
    expect(secondBlocked.penaltyLevel).toBe(2);
    expect(secondBlocked.retryAfterSeconds).toBeGreaterThanOrEqual(
      firstBlocked.retryAfterSeconds,
    );

    await withSqliteWriteLock(async (db) => {
      db.run(
        `UPDATE auth_rate_limits
         SET blocked_until = ?, window_started_at = ?
         WHERE scope = ? AND identifier = ?`,
        [
          new Date(Date.now() - 1000).toISOString(),
          new Date(Date.now() - policy.windowMs - 1000).toISOString(),
          "login",
          identifier,
        ],
      );
    });

    const recoveredState = await authRateLimitRepository.getState(
      "login",
      identifier,
      policy,
    );

    expect(recoveredState.allowed).toBe(true);
    expect(recoveredState.attemptsRemaining).toBe(policy.maxAttempts);
    expect(recoveredState.penaltyLevel).toBe(2);
  });
});

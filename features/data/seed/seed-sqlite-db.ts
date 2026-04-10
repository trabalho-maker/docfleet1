import bcrypt from "bcryptjs";
import type { Database } from "sql.js";
import type { FleetDocument, OperationalAlert } from "@/features/data/types";
import {
  addUtcDays,
  calculateDocumentStatus,
  formatUtcDateOnly,
} from "@/features/documents/lib/expiration";
import { logger, maskEmail } from "@/lib/logger";
import type { Associate } from "@/src/features/associates/types";

const defaultSeedRole = "Gestor de frota";

function buildSeedDocuments(now = new Date()): FleetDocument[] {
  const dueDates = {
    doc03: formatUtcDateOnly(addUtcDays(now, 4)),
    doc01: formatUtcDateOnly(addUtcDays(now, 10)),
    doc02: formatUtcDateOnly(addUtcDays(now, 45)),
  };

  return [
    {
      id: "doc_01",
      name: "Licenciamento da frota leve",
      owner: "Equipe Operacional",
      type: "Veiculos",
      status: calculateDocumentStatus(dueDates.doc01, { now }),
      dueDate: dueDates.doc01,
    },
    {
      id: "doc_02",
      name: "Contratos de manutencao",
      owner: "Suprimentos",
      type: "Contratos",
      status: calculateDocumentStatus(dueDates.doc02, { now }),
      dueDate: dueDates.doc02,
    },
    {
      id: "doc_03",
      name: "ASO dos motoristas",
      owner: "RH",
      type: "Pessoas",
      status: calculateDocumentStatus(dueDates.doc03, { now }),
      dueDate: dueDates.doc03,
    },
  ];
}

const seedAlerts: OperationalAlert[] = [
  {
    id: "alt_01",
    title: "3 documentos vencem esta semana",
    severity: "Alta",
    team: "Operacoes",
    createdAt: "2026-04-06 08:30",
  },
  {
    id: "alt_02",
    title: "Checklist de auditoria incompleto",
    severity: "Media",
    team: "Qualidade",
    createdAt: "2026-04-06 09:10",
  },
  {
    id: "alt_03",
    title: "Fila de aprovacao abaixo do SLA",
    severity: "Baixa",
    team: "Backoffice",
    createdAt: "2026-04-06 10:00",
  },
];

const seedAssociates: Associate[] = [
  {
    id: "asc_01",
    name: "Maria de Souza",
    cpf: "39053344705",
    category: "Titular",
    registrationNumber: "MAT-2026-0001",
    status: "Ativo",
    admissionDate: "2023-02-15",
    createdAt: "2026-04-06T08:15:00.000Z",
    updatedAt: "2026-04-06T08:15:00.000Z",
  },
  {
    id: "asc_02",
    name: "Joao Pereira",
    cpf: "16899535009",
    category: "Contribuinte",
    registrationNumber: "MAT-2026-0002",
    status: "Suspenso",
    admissionDate: "2022-09-01",
    createdAt: "2026-04-06T08:20:00.000Z",
    updatedAt: "2026-04-06T08:20:00.000Z",
  },
  {
    id: "asc_03",
    name: "Ana Beatriz Lima",
    cpf: "93541134780",
    category: "Dependente",
    registrationNumber: "MAT-2026-0003",
    status: "Ativo",
    admissionDate: "2024-01-10",
    createdAt: "2026-04-06T08:25:00.000Z",
    updatedAt: "2026-04-06T08:25:00.000Z",
  },
];

export async function seedSqliteDatabase(db: Database) {
  const seedDocuments = buildSeedDocuments();
  const seedUserName = process.env.SEED_USER_NAME?.trim();
  const seedUserEmail = process.env.SEED_USER_EMAIL?.trim().toLowerCase();
  const seedUserPassword = process.env.SEED_USER_PASSWORD;
  const seedUserRole = process.env.SEED_USER_ROLE?.trim() || defaultSeedRole;

  if (!seedUserName || !seedUserEmail || !seedUserPassword) {
    logger.error("data.seed.missing_credentials", {
      email: maskEmail(seedUserEmail ?? ""),
    });
    throw new Error(
      "Missing seed credentials. Configure SEED_USER_NAME, SEED_USER_EMAIL and SEED_USER_PASSWORD in your environment.",
    );
  }

  const passwordHash = await bcrypt.hash(seedUserPassword, 10);

  db.run("BEGIN");

  try {
    db.run("DELETE FROM users");
    db.run("DELETE FROM documents");
    db.run("DELETE FROM alerts");
    db.run("DELETE FROM password_reset_tokens");
    db.run("DELETE FROM auth_rate_limits");
    db.run("DELETE FROM associates");

    db.run(
      "INSERT INTO users (id, name, email, role, password_hash) VALUES (?, ?, ?, ?, ?)",
      [
        "usr_operacoes",
        seedUserName,
        seedUserEmail,
        seedUserRole,
        passwordHash,
      ],
    );

    for (const document of seedDocuments) {
      db.run(
        "INSERT INTO documents (id, name, owner, type, status, due_date) VALUES (?, ?, ?, ?, ?, ?)",
        [
          document.id,
          document.name,
          document.owner,
          document.type,
          document.status,
          document.dueDate,
        ],
      );
    }

    for (const alert of seedAlerts) {
      db.run(
        "INSERT INTO alerts (id, title, severity, team, created_at) VALUES (?, ?, ?, ?, ?)",
        [alert.id, alert.title, alert.severity, alert.team, alert.createdAt],
      );
    }

    for (const associate of seedAssociates) {
      db.run(
        `INSERT INTO associates (
          id,
          name,
          cpf,
          category,
          registration_number,
          status,
          admission_date,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          associate.id,
          associate.name,
          associate.cpf,
          associate.category,
          associate.registrationNumber,
          associate.status,
          associate.admissionDate,
          associate.createdAt,
          associate.updatedAt,
        ],
      );
    }

    db.run("COMMIT");
    logger.info("data.seed.completed", {
      userEmail: maskEmail(seedUserEmail),
      documents: seedDocuments.length,
      alerts: seedAlerts.length,
      associates: seedAssociates.length,
    });
  } catch (error) {
    db.run("ROLLBACK");
    logger.error("data.seed.failed", {
      error,
    });
    throw error;
  }
}

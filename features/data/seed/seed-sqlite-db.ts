import bcrypt from "bcryptjs";
import type { Database } from "sql.js";
import type { FleetDocument, OperationalAlert } from "@/features/data/types";
import { logger, maskEmail } from "@/lib/logger";

const defaultSeedRole = "Gestor de frota";

const seedDocuments: FleetDocument[] = [
  {
    id: "doc_01",
    title: "Licenciamento da frota leve",
    owner: "Equipe Operacional",
    category: "Veiculos",
    status: "A vencer",
    dueDate: "2026-04-18",
  },
  {
    id: "doc_02",
    title: "Contratos de manutencao",
    owner: "Suprimentos",
    category: "Contratos",
    status: "Em dia",
    dueDate: "2026-06-01",
  },
  {
    id: "doc_03",
    title: "ASO dos motoristas",
    owner: "RH",
    category: "Pessoas",
    status: "Pendente",
    dueDate: "2026-04-12",
  },
];

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

export async function seedSqliteDatabase(db: Database) {
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
        "INSERT INTO documents (id, title, owner, category, status, due_date) VALUES (?, ?, ?, ?, ?, ?)",
        [
          document.id,
          document.title,
          document.owner,
          document.category,
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

    db.run("COMMIT");
    logger.info("data.seed.completed", {
      userEmail: maskEmail(seedUserEmail),
      documents: seedDocuments.length,
      alerts: seedAlerts.length,
    });
  } catch (error) {
    db.run("ROLLBACK");
    logger.error("data.seed.failed", {
      error,
    });
    throw error;
  }
}

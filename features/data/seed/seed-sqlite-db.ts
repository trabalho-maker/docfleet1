import bcrypt from "bcryptjs";
import type { Database } from "sql.js";
import type { FleetDocument, OperationalAlert } from "@/features/data/types";
import {
  addUtcDays,
  calculateDocumentStatus,
  formatUtcDateOnly,
} from "@/features/documents/lib/expiration";
import { logger, maskEmail } from "@/lib/logger";
import { createEmptyAssociateProfile } from "@/features/associates/server/associate-profile.repository";
import type { Associate } from "@/features/associates/types";
import type { AssociateOperationProfile } from "@/features/associates/operations/types";

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
      type: "Veículos",
      status: calculateDocumentStatus(dueDates.doc01, { now }),
      dueDate: dueDates.doc01,
    },
    {
      id: "doc_02",
      name: "Contratos de manutenção",
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
    team: "Operações",
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
    title: "Fila de aprovação abaixo do SLA",
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
    ...createEmptyAssociateProfile(),
  },
  {
    id: "asc_02",
    name: "João Pereira",
    cpf: "16899535009",
    category: "Contribuinte",
    registrationNumber: "MAT-2026-0002",
    status: "Suspenso",
    admissionDate: "2022-09-01",
    createdAt: "2026-04-06T08:20:00.000Z",
    updatedAt: "2026-04-06T08:20:00.000Z",
    ...createEmptyAssociateProfile(),
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
    ...createEmptyAssociateProfile(),
  },
  {
    id: "asc_04",
    name: "Transporte Azul Logística",
    cpf: "27865757000",
    category: "Titular",
    registrationNumber: "MAT-2026-0004",
    status: "Ativo",
    admissionDate: "2021-07-22",
    createdAt: "2026-04-06T08:28:00.000Z",
    updatedAt: "2026-04-06T08:28:00.000Z",
    ...createEmptyAssociateProfile(),
  },
];

const seedAssociateOperationProfiles: AssociateOperationProfile[] = [
  {
    associateId: "asc_01",
    operationType: "Taxista",
    basicDocumentationDueDate: formatUtcDateOnly(addUtcDays(new Date(), 16)),
    vehicleAuthorizationDueDate: null,
    driverAuthorizationDueDate: null,
    cargoLicensingDueDate: null,
    createdAt: "2026-04-06T08:30:00.000Z",
    updatedAt: "2026-04-06T08:30:00.000Z",
  },
  {
    associateId: "asc_02",
    operationType: "TransporteEscolar",
    basicDocumentationDueDate: null,
    vehicleAuthorizationDueDate: formatUtcDateOnly(addUtcDays(new Date(), 5)),
    driverAuthorizationDueDate: formatUtcDateOnly(addUtcDays(new Date(), -2)),
    cargoLicensingDueDate: null,
    createdAt: "2026-04-06T08:35:00.000Z",
    updatedAt: "2026-04-06T08:35:00.000Z",
  },
  {
    associateId: "asc_03",
    operationType: "Caminhao",
    basicDocumentationDueDate: null,
    vehicleAuthorizationDueDate: null,
    driverAuthorizationDueDate: null,
    cargoLicensingDueDate: formatUtcDateOnly(addUtcDays(new Date(), 45)),
    createdAt: "2026-04-06T08:40:00.000Z",
    updatedAt: "2026-04-06T08:40:00.000Z",
  },
  {
    associateId: "asc_04",
    operationType: "Empresa",
    basicDocumentationDueDate: formatUtcDateOnly(addUtcDays(new Date(), 24)),
    vehicleAuthorizationDueDate: null,
    driverAuthorizationDueDate: null,
    cargoLicensingDueDate: null,
    createdAt: "2026-04-06T08:42:00.000Z",
    updatedAt: "2026-04-06T08:42:00.000Z",
  },
];

const seedAssociateProfiles = [
  {
    associateId: "asc_01",
    modalidadeAssociado: "TAXI",
    enderecoCompleto: "Rua 1, 200 - Centro",
    bairro: "Centro",
    cidade: "Rio Claro",
    estado: "SP",
    cep: "13500000",
    profissao: "Taxista",
    sexo: "F",
    dataNascimento: "1989-06-20",
    nacionalidade: "Brasileira",
    naturalidade: "Rio Claro",
    rg: "28.456.789-0",
    cnh: "01234567890",
    estadoCivil: "Casado(a)",
    nomePai: "Carlos de Souza",
    nomeMae: "Helena de Souza",
    dependentes: "2",
    grauParentesco: "Filhos",
    telefone: "(19) 3522-0001",
    celular: "(19) 99888-0001",
    email: "maria.souza@exemplo.com",
    observacoes: "Associada com ficha regularizada para atendimento.",
    situacaoFinanceira: "Mensalidade em dia.",
    situacaoDocumental: "Documentação principal atualizada.",
    historicoResumo: "Cadastro revisado na última campanha sindical.",
    fotoUrl: null,
    createdAt: "2026-04-06T08:45:00.000Z",
    updatedAt: "2026-04-06T08:45:00.000Z",
  },
  {
    associateId: "asc_02",
    modalidadeAssociado: "ESCOLAR",
    enderecoCompleto: "Avenida 12, 900",
    bairro: "Jardim América",
    cidade: "Rio Claro",
    estado: "SP",
    cep: "13506120",
    profissao: "Condutor escolar",
    sexo: "M",
    dataNascimento: "1978-03-11",
    nacionalidade: "Brasileira",
    naturalidade: "Araras",
    rg: "19.223.456-1",
    cnh: "00998877665",
    estadoCivil: "Solteiro(a)",
    nomePai: "Antonio Pereira",
    nomeMae: "Lucia Pereira",
    dependentes: "1",
    grauParentesco: "Filho",
    telefone: "(19) 3522-0002",
    celular: "(19) 99888-0002",
    email: "joao.pereira@exemplo.com",
    observacoes: "Necessita acompanhamento documental periódico.",
    situacaoFinanceira: "Pendência de uma mensalidade.",
    situacaoDocumental: "Autorização do condutor vencida.",
    historicoResumo: "Associado retornou ao quadro em 2024.",
    fotoUrl: null,
    createdAt: "2026-04-06T08:50:00.000Z",
    updatedAt: "2026-04-06T08:50:00.000Z",
  },
  {
    associateId: "asc_03",
    modalidadeAssociado: "CAMINHAO",
    enderecoCompleto: "Rua 14, 1220",
    bairro: "Vila Nova",
    cidade: "Rio Claro",
    estado: "SP",
    cep: "13504510",
    profissao: "Transportador autonomo",
    sexo: "F",
    dataNascimento: "1990-11-02",
    nacionalidade: "Brasileira",
    naturalidade: "Rio Claro",
    rg: "31.552.199-4",
    cnh: "12345098761",
    estadoCivil: "Solteiro(a)",
    nomePai: "Paulo Lima",
    nomeMae: "Neide Lima",
    dependentes: null,
    grauParentesco: null,
    telefone: "(19) 3522-0003",
    celular: "(19) 99888-0003",
    email: "ana.lima@exemplo.com",
    observacoes: "Cadastro com foco em operacao de cargas.",
    situacaoFinanceira: "Mensalidade em dia.",
    situacaoDocumental: "Licenciamento acompanhado pela operacao.",
    historicoResumo: "Associada ativa desde 2024.",
    fotoUrl: null,
    createdAt: "2026-04-06T08:52:00.000Z",
    updatedAt: "2026-04-06T08:52:00.000Z",
  },
  {
    associateId: "asc_04",
    modalidadeAssociado: "CNPJ",
    cnpjEmpresa: "27865757000102",
    nomeEmpresa: "Transporte Azul Logística Ltda.",
    enderecoCompleto: "Rodovia SP-191, km 112",
    bairro: "Distrito Industrial",
    cidade: "Rio Claro",
    estado: "SP",
    cep: "13505680",
    profissao: "Transporte de cargas",
    sexo: null,
    dataNascimento: null,
    nacionalidade: "Brasileira",
    naturalidade: "Rio Claro",
    rg: null,
    cnh: null,
    estadoCivil: null,
    nomePai: null,
    nomeMae: null,
    dependentes: null,
    grauParentesco: null,
    telefone: "(19) 3522-0004",
    celular: "(19) 99888-0004",
    email: "contato@transporteazul.com.br",
    observacoes: "Empresa associada com cadastro empresarial ativo.",
    situacaoFinanceira: "Mensalidade em dia.",
    situacaoDocumental: "CNPJ e cadastro empresarial atualizados.",
    historicoResumo: "Perfil empresarial criado para a nova operação.",
    fotoUrl: null,
    createdAt: "2026-04-06T08:55:00.000Z",
    updatedAt: "2026-04-06T08:55:00.000Z",
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
    db.run("DELETE FROM associate_operation_profiles");
    db.run("DELETE FROM associate_profiles");
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

    for (const profile of seedAssociateOperationProfiles) {
      db.run(
        `INSERT INTO associate_operation_profiles (
          associate_id,
          operation_type,
          basic_documentation_due_date,
          vehicle_authorization_due_date,
          driver_authorization_due_date,
          cargo_licensing_due_date,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          profile.associateId,
          profile.operationType,
          profile.basicDocumentationDueDate,
          profile.vehicleAuthorizationDueDate,
          profile.driverAuthorizationDueDate,
          profile.cargoLicensingDueDate,
          profile.createdAt,
          profile.updatedAt,
        ],
      );
    }

      for (const profile of seedAssociateProfiles) {
        db.run(
          `INSERT INTO associate_profiles (
            associate_id,
            modalidade_associado,
            cnpj_empresa,
            nome_empresa,
            endereco_completo,
            bairro,
            cidade,
            estado,
            cep,
          profissao,
          sexo,
          data_nascimento,
          nacionalidade,
          naturalidade,
          rg,
          cnh,
          estado_civil,
          nome_pai,
          nome_mae,
          dependentes,
          grau_parentesco,
          telefone,
          celular,
          email,
          observacoes,
          situacao_financeira,
            situacao_documental,
            historico_resumo,
            foto_url,
            created_at,
            updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
          [
            profile.associateId,
            profile.modalidadeAssociado ?? null,
            profile.cnpjEmpresa ?? null,
            profile.nomeEmpresa ?? null,
            profile.enderecoCompleto,
            profile.bairro,
            profile.cidade,
            profile.estado,
          profile.cep,
          profile.profissao,
          profile.sexo,
          profile.dataNascimento,
          profile.nacionalidade,
          profile.naturalidade,
          profile.rg,
          profile.cnh,
          profile.estadoCivil,
          profile.nomePai,
          profile.nomeMae,
          profile.dependentes,
          profile.grauParentesco,
          profile.telefone,
          profile.celular,
          profile.email,
          profile.observacoes,
          profile.situacaoFinanceira,
          profile.situacaoDocumental,
          profile.historicoResumo,
          profile.fotoUrl,
          profile.createdAt,
          profile.updatedAt,
        ],
      );
    }

    db.run("COMMIT");
    logger.info("data.seed.completed", {
      userEmail: maskEmail(seedUserEmail),
      documents: seedDocuments.length,
      alerts: seedAlerts.length,
      associates: seedAssociates.length,
      operationProfiles: seedAssociateOperationProfiles.length,
      associateProfiles: seedAssociateProfiles.length,
    });
  } catch (error) {
    db.run("ROLLBACK");
    logger.error("data.seed.failed", {
      error,
    });
    throw error;
  }
}


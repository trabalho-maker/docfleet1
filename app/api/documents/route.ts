import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  canManageOperationalData,
  canViewOperationalData,
} from "@/features/auth/lib/role-authorization";
import { SqliteAssociateRepository } from "@/features/associates/server/associate.repository";
import { createDataLayer } from "@/features/data/repositories";
import { createDocumentWithAlerts } from "@/features/documents/server/document-service";
import { validateDocumentInput } from "@/features/documents/server/validation";
import {
  type DocumentCategoryFilter,
  documentCategoryFilters,
  parseDocumentType,
} from "@/features/documents/constants";
import { logger } from "@/lib/logger";
import { parseJsonBody } from "@/lib/server/request-body";

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

function parsePositiveInteger(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

function parseCategoryFilter(value: string | null) {
  if (!value) {
    return "" as const;
  }

  const normalizedValue = value.trim().toUpperCase();

  return documentCategoryFilters.includes(
    normalizedValue as (typeof documentCategoryFilters)[number],
  )
    ? (normalizedValue as DocumentCategoryFilter)
    : null;
}

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  if (!canViewOperationalData(session.user)) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = parsePositiveInteger(searchParams.get("page"), 1);
  const pageSize = Math.min(
    parsePositiveInteger(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE),
    MAX_PAGE_SIZE,
  );
  const category = parseCategoryFilter(searchParams.get("category"));

  if (category === null) {
    return NextResponse.json({ error: "Categoria inválida." }, { status: 400 });
  }

  const dataLayer = createDataLayer();
  const total = await dataLayer.documents.countAll({
    category,
  });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const [documents, summary] = await Promise.all([
    dataLayer.documents.listPage(currentPage, pageSize, {
      category,
    }),
    dataLayer.documents.summarizeByDueDate({
      category,
    }),
  ]);

  return NextResponse.json({
    documents,
    pagination: {
      page: currentPage,
      pageSize,
      total,
      totalPages,
    },
    summary,
  });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  if (!canManageOperationalData(session.user)) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const bodyResult = await parseJsonBody<{
    associateId?: string;
    documentType?: string;
    dueDate?: string;
    notes?: string;
  }>(request);

  if (!bodyResult.success) {
    return NextResponse.json({ error: "Corpo JSON inválido." }, { status: 400 });
  }

  const body = bodyResult.data;
  const validation = validateDocumentInput({
    dueDate: body.dueDate ?? "",
    notes: body.notes ?? "",
  });
  const associateId = body.associateId?.trim() ?? "";
  const documentType = parseDocumentType(body.documentType);

  if (!associateId) {
    return NextResponse.json(
      { error: "Dados inválidos.", fieldErrors: { associateId: "Informe o associado." } },
      { status: 400 },
    );
  }

  if (!documentType) {
    return NextResponse.json(
      { error: "Dados inválidos.", fieldErrors: { documentType: "Informe um tipo válido." } },
      { status: 400 },
    );
  }

  if (!validation.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", fieldErrors: validation.errors },
      { status: 400 },
    );
  }

  const associateRepository = new SqliteAssociateRepository();
  const associate = await associateRepository.findById(associateId);

  if (!associate) {
    return NextResponse.json({ error: "Associado não encontrado." }, { status: 404 });
  }

  const document = await createDocumentWithAlerts({
    associateId,
    documentType,
    dueDate: validation.data.dueDate,
    notes: validation.data.notes,
    owner: session.user.name ?? session.user.email ?? "Usuário DocFleet",
  });

  logger.info("api.documents.create.success", {
    documentId: document.id,
    associateId,
    userId: session.user.id,
  });

  return NextResponse.json({ document }, { status: 201 });
}

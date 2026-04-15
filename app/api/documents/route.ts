import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  canManageOperationalData,
  canViewOperationalData,
} from "@/features/auth/lib/role-authorization";
import { createDataLayer } from "@/features/data/repositories";
import { createDocumentWithAlerts } from "@/features/documents/server/document-service";
import { validateDocumentInput } from "@/features/documents/server/validation";
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
  const dataLayer = createDataLayer();
  const [total, requiringAttention, attention] = await Promise.all([
    dataLayer.documents.countAll(),
    dataLayer.documents.countPending(),
    dataLayer.documents.countAttention(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const documents = await dataLayer.documents.listPage(currentPage, pageSize);

  return NextResponse.json({
    documents,
    pagination: {
      page: currentPage,
      pageSize,
      total,
      totalPages,
    },
    summary: {
      total,
      requiringAttention,
      attention,
    },
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
    name?: string;
    type?: string;
    dueDate?: string;
  }>(request);

  if (!bodyResult.success) {
    return NextResponse.json(
      { error: "Corpo JSON inválido." },
      { status: 400 },
    );
  }

  const body = bodyResult.data;

  const validation = validateDocumentInput({
    name: body.name ?? "",
    type: body.type ?? "",
    dueDate: body.dueDate ?? "",
  });

  if (!validation.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", fieldErrors: validation.errors },
      { status: 400 },
    );
  }

  const document = await createDocumentWithAlerts({
    ...validation.data,
    owner: session.user.name ?? session.user.email ?? "Usuário DocFleet",
  });

  logger.info("api.documents.create.success", {
    documentId: document.id,
    userId: session.user.id,
  });

  return NextResponse.json({ document }, { status: 201 });
}

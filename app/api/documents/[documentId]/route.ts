import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  canManageOperationalData,
  canViewOperationalData,
} from "@/features/auth/lib/role-authorization";
import {
  deleteDocumentWithAlerts,
  updateDocumentWithAlerts,
} from "@/features/documents/server/document-service";
import { createDataLayer } from "@/features/data/repositories";
import { validateDocumentInput } from "@/features/documents/server/validation";
import { logger } from "@/lib/logger";
import { parseJsonBody } from "@/lib/server/request-body";

type RouteContext = {
  params: Promise<{
    documentId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  if (!canViewOperationalData(session.user)) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const { documentId } = await context.params;
  const dataLayer = createDataLayer();
  const document = await dataLayer.documents.findById(documentId);

  if (!document) {
    return NextResponse.json({ error: "Documento não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ document });
}

export async function PUT(request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  if (!canManageOperationalData(session.user)) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const { documentId } = await context.params;
  const bodyResult = await parseJsonBody<{
    dueDate?: string;
    notes?: string;
  }>(request);

  if (!bodyResult.success) {
    return NextResponse.json({ error: "Corpo JSON invalido." }, { status: 400 });
  }

  const validation = validateDocumentInput({
    dueDate: bodyResult.data.dueDate ?? "",
    notes: bodyResult.data.notes ?? "",
  });

  if (!validation.success) {
    return NextResponse.json(
      { error: "Dados invalidos.", fieldErrors: validation.errors },
      { status: 400 },
    );
  }

  try {
    const document = await updateDocumentWithAlerts(documentId, validation.data);

    logger.info("api.documents.update.success", {
      documentId,
      userId: session.user.id,
    });

    return NextResponse.json({ document });
  } catch (error) {
    if (error instanceof Error && error.message === "DOCUMENT_NOT_FOUND") {
      return NextResponse.json(
        { error: "Documento não encontrado." },
        { status: 404 },
      );
    }

    throw error;
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  if (!canManageOperationalData(session.user)) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const { documentId } = await context.params;

  try {
    await deleteDocumentWithAlerts(documentId);

    logger.warn("api.documents.delete.success", {
      documentId,
      userId: session.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "DOCUMENT_NOT_FOUND") {
      return NextResponse.json(
        { error: "Documento não encontrado." },
        { status: 404 },
      );
    }

    throw error;
  }
}

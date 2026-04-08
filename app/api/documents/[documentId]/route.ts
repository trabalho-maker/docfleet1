import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createDataLayer } from "@/features/data/repositories";
import { validateDocumentInput } from "@/features/documents/server/validation";
import { logger } from "@/lib/logger";

type RouteContext = {
  params: Promise<{
    documentId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const { documentId } = await context.params;
  const dataLayer = createDataLayer();
  const document = await dataLayer.documents.findById(documentId);

  if (!document) {
    return NextResponse.json({ error: "Documento nao encontrado." }, { status: 404 });
  }

  return NextResponse.json({ document });
}

export async function PUT(request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const { documentId } = await context.params;
  const body = (await request.json()) as {
    name?: string;
    type?: string;
    dueDate?: string;
    status?: string;
  };

  const validation = validateDocumentInput({
    name: body.name ?? "",
    type: body.type ?? "",
    dueDate: body.dueDate ?? "",
    status: body.status as "Em dia" | "A vencer" | "Pendente",
  });

  if (!validation.success) {
    return NextResponse.json(
      { error: "Dados invalidos.", fieldErrors: validation.errors },
      { status: 400 },
    );
  }

  try {
    const dataLayer = createDataLayer();
    const document = await dataLayer.documents.update(documentId, validation.data);

    logger.info("api.documents.update.success", {
      documentId,
      userId: session.user.id,
    });

    return NextResponse.json({ document });
  } catch (error) {
    if (error instanceof Error && error.message === "DOCUMENT_NOT_FOUND") {
      return NextResponse.json(
        { error: "Documento nao encontrado." },
        { status: 404 },
      );
    }

    throw error;
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const { documentId } = await context.params;

  try {
    const dataLayer = createDataLayer();
    await dataLayer.documents.delete(documentId);

    logger.warn("api.documents.delete.success", {
      documentId,
      userId: session.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "DOCUMENT_NOT_FOUND") {
      return NextResponse.json(
        { error: "Documento nao encontrado." },
        { status: 404 },
      );
    }

    throw error;
  }
}

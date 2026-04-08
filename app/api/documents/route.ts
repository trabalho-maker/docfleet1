import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createDataLayer } from "@/features/data/repositories";
import { validateDocumentInput } from "@/features/documents/server/validation";
import { logger } from "@/lib/logger";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const dataLayer = createDataLayer();
  const documents = await dataLayer.documents.listAll();

  return NextResponse.json({ documents });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

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

  const dataLayer = createDataLayer();
  const document = await dataLayer.documents.create({
    ...validation.data,
    owner: session.user.name ?? session.user.email ?? "Usuario DocFleet",
  });

  logger.info("api.documents.create.success", {
    documentId: document.id,
    userId: session.user.id,
  });

  return NextResponse.json({ document }, { status: 201 });
}

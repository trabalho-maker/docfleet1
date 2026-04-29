jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));

import { auth } from "@/auth";
import { createDataLayer } from "@/features/data/repositories";
import { createJsonRequest, authenticatedSession } from "@/features/integration/test-helpers";
import { DELETE, GET as GET_BY_ID, PUT } from "@/app/api/documents/[documentId]/route";
import { GET, POST } from "@/app/api/documents/route";
import {
  resetSqliteDatabase,
  resetSqliteStorageState,
} from "@/lib/storage/sqlite-storage";

const mockedAuth = auth as jest.Mock;

describe("documents api integration", () => {
  beforeEach(async () => {
    await resetSqliteStorageState();
    await resetSqliteDatabase();
    mockedAuth.mockReset();
    mockedAuth.mockResolvedValue(authenticatedSession);
  });

  afterAll(async () => {
    await resetSqliteStorageState();
  });

  it("rejects unauthenticated access to the documents API", async () => {
    mockedAuth.mockResolvedValueOnce(null);

    const response = await GET(new Request("http://localhost/api/documents"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Não autenticado.",
    });
  });

  it("allows operators to read documents but blocks mutations", async () => {
    mockedAuth.mockResolvedValue({
      user: {
        ...authenticatedSession.user,
        role: "Operador",
      },
    });

    const listResponse = await GET(new Request("http://localhost/api/documents"));
    expect(listResponse.status).toBe(200);

    const createResponse = await POST(
      createJsonRequest("http://localhost/api/documents", {
        method: "POST",
        body: {
          associateId: "asc_01",
          documentType: "CNH",
          dueDate: "2099-01-03",
        },
      }),
    );

    expect(createResponse.status).toBe(403);
    await expect(createResponse.json()).resolves.toEqual({
      error: "Acesso negado.",
    });
  });

  it("returns 400 when the create payload is invalid JSON", async () => {
    const response = await POST(
      new Request("http://localhost/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: "{",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Corpo JSON invalido.",
    });
  });

  it("returns 400 when the update payload is invalid JSON", async () => {
    const response = await PUT(
      new Request("http://localhost/api/documents/doc_01", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: "{",
      }),
      {
        params: Promise.resolve({ documentId: "doc_01" }),
      },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Corpo JSON invalido.",
    });
  });

  it("rejects invalid documentType values instead of coercing them to OUTRO", async () => {
    const response = await POST(
      createJsonRequest("http://localhost/api/documents", {
        method: "POST",
        body: {
          associateId: "asc_01",
          documentType: "documento_inexistente",
          dueDate: "2099-01-03",
        },
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Dados invalidos.",
      fieldErrors: {
        documentType: "Informe um tipo valido.",
      },
    });
  });

  it("accepts OUTRO only when it is sent explicitly", async () => {
    const response = await POST(
      createJsonRequest("http://localhost/api/documents", {
        method: "POST",
        body: {
          associateId: "asc_01",
          documentType: "OUTRO",
          dueDate: "2099-01-03",
          notes: "Tipo intencionalmente generico.",
        },
      }),
    );
    const payload = (await response.json()) as {
      document: { id: string; documentType: string; associateId: string };
    };

    expect(response.status).toBe(201);
    expect(payload.document).toMatchObject({
      documentType: "OUTRO",
      associateId: "asc_01",
    });
  });

  it("executes the structured document flow with category filtering and keeps alerts in sync", async () => {
    const listBeforeResponse = await GET(
      new Request("http://localhost/api/documents?category=TAXI"),
    );
    const listBeforePayload = (await listBeforeResponse.json()) as {
      documents: Array<{ id: string; documentType: string; associateCategory: string }>;
      pagination: { total: number; page: number; totalPages: number };
      summary: { total: number; expired: number; dueIn15Days: number; dueIn30Days: number };
    };

    expect(listBeforeResponse.status).toBe(200);
    expect(listBeforePayload.documents).toHaveLength(1);
    expect(listBeforePayload.documents[0]).toMatchObject({
      id: "doc_01",
      documentType: "CNH",
      associateCategory: "TAXI",
    });
    expect(listBeforePayload.pagination.total).toBe(1);

    const createResponse = await POST(
      createJsonRequest("http://localhost/api/documents", {
        method: "POST",
        body: {
          associateId: "asc_01",
          documentType: "TACOGRAFO",
          dueDate: "2099-01-03",
          notes: "Criado pela integracao.",
        },
      }),
    );
    const createdPayload = (await createResponse.json()) as {
      document: { id: string; documentType: string; status: string; associateId: string };
    };

    expect(createResponse.status).toBe(201);
    expect(createdPayload.document.documentType).toBe("TACOGRAFO");
    expect(createdPayload.document.associateId).toBe("asc_01");
    expect(createdPayload.document.status).toBe("Valido");

    const createdDocumentId = createdPayload.document.id;
    const dataLayer = createDataLayer();

    expect(
      await dataLayer.alerts.findGeneratedBySourceDocumentId(createdDocumentId),
    ).toBeNull();

    const updateResponse = await PUT(
      createJsonRequest(`http://localhost/api/documents/${createdDocumentId}`, {
        method: "PUT",
        body: {
          dueDate: "2000-01-03",
          notes: "Documento vencido.",
        },
      }),
      {
        params: Promise.resolve({ documentId: createdDocumentId }),
      },
    );
    const updatedPayload = (await updateResponse.json()) as {
      document: { id: string; status: string; notes: string };
    };

    expect(updateResponse.status).toBe(200);
    expect(updatedPayload.document.status).toBe("Vencido");
    expect(updatedPayload.document.notes).toBe("Documento vencido.");

    const generatedAlert = await dataLayer.alerts.findGeneratedBySourceDocumentId(
      createdDocumentId,
    );

    expect(generatedAlert).not.toBeNull();
    expect(generatedAlert?.title).toContain("Maria de Souza");

    const getByIdResponse = await GET_BY_ID(new Request("http://localhost"), {
      params: Promise.resolve({ documentId: createdDocumentId }),
    });
    const getByIdPayload = (await getByIdResponse.json()) as {
      document: { id: string; status: string; associateId: string };
    };

    expect(getByIdResponse.status).toBe(200);
    expect(getByIdPayload.document.id).toBe(createdDocumentId);
    expect(getByIdPayload.document.status).toBe("Vencido");
    expect(getByIdPayload.document.associateId).toBe("asc_01");

    const deleteResponse = await DELETE(new Request("http://localhost"), {
      params: Promise.resolve({ documentId: createdDocumentId }),
    });

    expect(deleteResponse.status).toBe(200);
    await expect(deleteResponse.json()).resolves.toEqual({ success: true });

    expect(await dataLayer.documents.findById(createdDocumentId)).toBeNull();
    expect(
      await dataLayer.alerts.findGeneratedBySourceDocumentId(createdDocumentId),
    ).toBeNull();
  });
});

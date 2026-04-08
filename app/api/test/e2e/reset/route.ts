import { NextResponse } from "next/server";

function isE2eModeEnabled() {
  return process.env.E2E_TEST_MODE === "true";
}

function isAuthorized(request: Request) {
  const headerToken = request.headers.get("x-e2e-reset-token");
  return headerToken && headerToken === process.env.E2E_RESET_TOKEN;
}

export async function POST(request: Request) {
  if (!isE2eModeEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [{ clearEmailOutbox }, { resetSqliteDatabase, resetSqliteStorageState }] =
    await Promise.all([
      import("@/lib/email/email-outbox"),
      import("@/lib/storage/sqlite-storage"),
    ]);

  await resetSqliteStorageState();
  await clearEmailOutbox();
  await resetSqliteDatabase();

  return NextResponse.json({ ok: true });
}

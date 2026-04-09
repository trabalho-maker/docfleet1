export type EmailOutboxEntry = {
  id: string;
  createdAt: string;
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  metadata?: Record<string, string>;
};

type EmailOutboxRuntime = typeof import("./email-outbox-runtime");

let runtimePromise: Promise<EmailOutboxRuntime> | null = null;

function getEmailOutboxRuntime() {
  if (!runtimePromise) {
    runtimePromise = import("./email-outbox-runtime");
  }

  return runtimePromise;
}

export async function getEmailOutboxPath() {
  const runtime = await getEmailOutboxRuntime();
  return runtime.getEmailOutboxPath();
}

export async function readEmailOutbox(): Promise<EmailOutboxEntry[]> {
  const runtime = await getEmailOutboxRuntime();
  return runtime.readEmailOutbox();
}

export async function appendEmailOutboxEntry(entry: EmailOutboxEntry) {
  const runtime = await getEmailOutboxRuntime();
  return runtime.appendEmailOutboxEntry(entry);
}

export async function clearEmailOutbox() {
  const runtime = await getEmailOutboxRuntime();
  return runtime.clearEmailOutbox();
}

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

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

function getDefaultOutboxPath() {
  return path.join(/*turbopackIgnore: true*/ process.cwd(), "data", "email-outbox.json");
}

export function getEmailOutboxPath() {
  return process.env.EMAIL_FILE_OUTBOX_PATH?.trim() || getDefaultOutboxPath();
}

export async function readEmailOutbox(): Promise<EmailOutboxEntry[]> {
  const outboxPath = getEmailOutboxPath();

  try {
    const raw = await readFile(outboxPath, "utf8");
    return JSON.parse(raw) as EmailOutboxEntry[];
  } catch {
    return [];
  }
}

export async function appendEmailOutboxEntry(entry: EmailOutboxEntry) {
  const outboxPath = getEmailOutboxPath();
  await mkdir(path.dirname(outboxPath), { recursive: true });
  const current = await readEmailOutbox();
  current.unshift(entry);
  await writeFile(outboxPath, JSON.stringify(current, null, 2), "utf8");
}

export async function clearEmailOutbox() {
  const outboxPath = getEmailOutboxPath();
  await mkdir(path.dirname(outboxPath), { recursive: true });
  await writeFile(outboxPath, "[]", "utf8");
}

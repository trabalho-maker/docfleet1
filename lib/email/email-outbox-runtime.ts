import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { EmailOutboxEntry } from "@/lib/email/email-outbox";
import { getEmailOutboxPath as resolveEmailOutboxPath } from "@/lib/server/runtime-paths";

export function getEmailOutboxPath() {
  return resolveEmailOutboxPath();
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

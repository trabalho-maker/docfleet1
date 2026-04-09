import type { EmailDeliveryResult, SendEmailInput } from "@/lib/email/mailer-contract";
import { EmailDeliveryError } from "@/lib/email/mailer-contract";

type MailerRuntime = typeof import("./mailer-runtime");

let runtimePromise: Promise<MailerRuntime> | null = null;

function getMailerRuntime() {
  if (!runtimePromise) {
    runtimePromise = import("./mailer-runtime");
  }

  return runtimePromise;
}

export { EmailDeliveryError };
export type { EmailDeliveryResult, SendEmailInput } from "@/lib/email/mailer-contract";

export async function sendEmail(input: SendEmailInput): Promise<EmailDeliveryResult> {
  try {
    const runtime = await getMailerRuntime();
    return runtime.sendEmail(input);
  } catch (error) {
    if (error instanceof EmailDeliveryError) {
      throw error;
    }

    throw new EmailDeliveryError("Failed to resolve email transport.", {
      cause: error,
    });
  }
}

import crypto from "node:crypto";
import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { logger, maskEmail } from "@/lib/logger";

type EmailMetadata = Record<string, string>;

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
  metadata?: EmailMetadata;
};

type EmailTransportMode = "smtp" | "file";

export type EmailDeliveryResult = {
  transport: EmailTransportMode;
  messageId: string;
};

export class EmailDeliveryError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "EmailDeliveryError";
  }
}

let transporterPromise: Promise<nodemailer.Transporter<SMTPTransport.SentMessageInfo>> | null =
  null;

function resolveEmailTransportMode(): EmailTransportMode {
  const configured = process.env.EMAIL_TRANSPORT?.trim().toLowerCase();

  if (configured === "smtp") {
    return "smtp";
  }

  if (configured === "file") {
    return "file";
  }

  if (process.env.SMTP_HOST?.trim() && process.env.SMTP_FROM?.trim()) {
    return "smtp";
  }

  if (
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV === "test"
  ) {
    return "file";
  }

  throw new EmailDeliveryError(
    "Email transport is not configured. Set EMAIL_TRANSPORT=file for development/test or provide complete SMTP settings.",
  );
}

function getSenderAddress() {
  return process.env.SMTP_FROM?.trim() || "DocFleet <no-reply@docfleet.local>";
}

async function getSmtpTransporter() {
  if (!transporterPromise) {
    const host = process.env.SMTP_HOST?.trim();
    const port = Number(process.env.SMTP_PORT?.trim() || "587");
    const secure = process.env.SMTP_SECURE?.trim() === "true";
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASSWORD;

    if (!host || !Number.isFinite(port) || !user || !pass || !process.env.SMTP_FROM?.trim()) {
      throw new EmailDeliveryError(
        "SMTP configuration is incomplete. Configure SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASSWORD and SMTP_FROM.",
      );
    }

    transporterPromise = Promise.resolve(
      nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
      }),
    );
  }

  return transporterPromise;
}

async function sendFileEmail(input: SendEmailInput): Promise<EmailDeliveryResult> {
  const messageId = `file-${crypto.randomUUID()}`;
  const { appendEmailOutboxEntry } = await import("@/lib/email/email-outbox");

  await appendEmailOutboxEntry({
    id: messageId,
    createdAt: new Date().toISOString(),
    from: getSenderAddress(),
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
    metadata: input.metadata,
  });

  logger.info("email.file.sent", {
    messageId,
    to: maskEmail(input.to),
    subject: input.subject,
  });

  return {
    transport: "file",
    messageId,
  };
}

async function sendSmtpEmail(input: SendEmailInput): Promise<EmailDeliveryResult> {
  try {
    const transporter = await getSmtpTransporter();
    const info = await transporter.sendMail({
      from: getSenderAddress(),
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });

    logger.info("email.smtp.sent", {
      messageId: info.messageId,
      to: maskEmail(input.to),
      subject: input.subject,
    });

    return {
      transport: "smtp",
      messageId: info.messageId,
    };
  } catch (error) {
    logger.error("email.smtp.failed", {
      to: maskEmail(input.to),
      subject: input.subject,
      error,
    });
    throw new EmailDeliveryError("Failed to send SMTP email.", { cause: error });
  }
}

export async function sendEmail(input: SendEmailInput): Promise<EmailDeliveryResult> {
  try {
    const mode = resolveEmailTransportMode();

    if (mode === "file") {
      return sendFileEmail(input);
    }

    return sendSmtpEmail(input);
  } catch (error) {
    if (error instanceof EmailDeliveryError) {
      throw error;
    }

    throw new EmailDeliveryError("Failed to resolve email transport.", {
      cause: error,
    });
  }
}

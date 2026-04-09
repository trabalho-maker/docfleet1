export type EmailMetadata = Record<string, string>;

export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
  metadata?: EmailMetadata;
};

export type EmailTransportMode = "smtp" | "file";

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

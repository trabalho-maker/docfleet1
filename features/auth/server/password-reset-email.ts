import type { StoredUser } from "@/features/data/types";
import { sendEmail } from "@/lib/email/mailer";
import { logger, maskEmail } from "@/lib/logger";

type PasswordResetEmailInput = {
  user: StoredUser;
  resetUrl: string;
  expiresAt: string;
};

export async function sendPasswordResetEmail({
  user,
  resetUrl,
  expiresAt,
}: PasswordResetEmailInput) {
  const subject = "Redefina sua senha do DocFleet";
  const text = [
    `Ola, ${user.name}.`,
    "",
    "Recebemos uma solicitacao para redefinir a senha da sua conta no DocFleet.",
    `Use o link abaixo para criar uma nova senha: ${resetUrl}`,
    `Este link expira em: ${expiresAt}.`,
    "",
    "Se voce nao fez esta solicitacao, ignore este email.",
  ].join("\n");
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
      <p>Ola, <strong>${escapeHtml(user.name)}</strong>.</p>
      <p>Recebemos uma solicitacao para redefinir a senha da sua conta no DocFleet.</p>
      <p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 20px; border-radius: 999px; background: #0f172a; color: #ffffff; text-decoration: none; font-weight: 600;">
          Redefinir senha
        </a>
      </p>
      <p>Se preferir, copie e cole este link no navegador:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>Este link expira em: <strong>${expiresAt}</strong>.</p>
      <p>Se voce nao fez esta solicitacao, ignore este email.</p>
    </div>
  `.trim();

  const result = await sendEmail({
    to: user.email,
    subject,
    text,
    html,
    metadata: {
      category: "password_reset",
      userId: user.id,
    },
  });

  logger.info("auth.password_reset.email.sent", {
    userId: user.id,
    email: maskEmail(user.email),
    transport: result.transport,
    messageId: result.messageId,
  });

  return result;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

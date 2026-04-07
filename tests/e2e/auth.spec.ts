import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { e2eEmailOutboxPath, getPlaywrightServerEnv } from "../../playwright/env";

type EmailOutboxEntry = {
  to: string;
  text: string;
};

const playwrightEnv = getPlaywrightServerEnv();
const loginEmail = playwrightEnv.SEED_USER_EMAIL || "operacoes@docfleet.local";
const loginPassword = playwrightEnv.SEED_USER_PASSWORD || "Senha1234";
const loginName = playwrightEnv.SEED_USER_NAME || "Operacoes DocFleet";
const newPassword = "NovaSenha123";

async function readOutbox(): Promise<EmailOutboxEntry[]> {
  try {
    const raw = await readFile(e2eEmailOutboxPath, "utf8");
    return JSON.parse(raw) as EmailOutboxEntry[];
  } catch {
    return [];
  }
}

async function waitForResetUrl() {
  const timeoutAt = Date.now() + 10_000;

  while (Date.now() < timeoutAt) {
    const [message] = await readOutbox();

    if (message?.to === loginEmail) {
      const match = message.text.match(/https?:\/\/\S+/);

      if (match?.[0]) {
        return match[0];
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(
    "Esperava encontrar o email de recuperacao na caixa de saida local.",
  );
}

test.describe("auth flows", () => {
  test("allows a seeded user to log in", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email", { exact: true }).fill(loginEmail);
    await page.getByLabel("Senha", { exact: true }).fill(loginPassword);
    await page.getByRole("button", { name: "Entrar no DocFleet" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: new RegExp(`Ola, ${loginName}`, "i") })).toBeVisible();
  });

  test("sends a reset email and allows login with the new password", async ({
    page,
  }) => {
    await page.goto("/recuperar-senha");

    await page.getByLabel("Email", { exact: true }).fill(loginEmail);
    await page.getByRole("button", { name: "Enviar link de recuperacao" }).click();

    await expect(
      page.getByText(
        "Se existir uma conta com esse email, enviaremos as instrucoes de recuperacao.",
      ),
    ).toBeVisible();

    const resetUrl = await waitForResetUrl();

    await page.goto(resetUrl);
    await page.getByLabel("Nova senha", { exact: true }).fill(newPassword);
    await page.getByLabel("Confirmar nova senha", { exact: true }).fill(
      newPassword,
    );
    await page.getByRole("button", { name: "Salvar nova senha" }).click();

    await expect(page).toHaveURL(/\/login\?reset=success$/);
    await expect(page.getByText("Senha redefinida com sucesso.")).toBeVisible();

    await page.getByLabel("Email", { exact: true }).fill(loginEmail);
    await page.getByLabel("Senha", { exact: true }).fill(newPassword);
    await page.getByRole("button", { name: "Entrar no DocFleet" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: new RegExp(`Ola, ${loginName}`, "i") })).toBeVisible();
  });
});

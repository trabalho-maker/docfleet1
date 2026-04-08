import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import {
  e2eEmailOutboxPath,
  e2eResetToken,
  e2eUser,
} from "../../playwright/env";

type EmailOutboxEntry = {
  to: string;
  text: string;
};

const loginEmail = e2eUser.email;
const loginPassword = e2eUser.password;
const loginName = e2eUser.name;
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
  test.beforeEach(async ({ request }) => {
    const response = await request.post("/api/test/e2e/reset", {
      headers: {
        "x-e2e-reset-token": e2eResetToken,
      },
    });

    expect(response.ok()).toBeTruthy();
  });

  test("allows a seeded user to log in", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email", { exact: true }).fill(loginEmail);
    await page.locator('input[name="password"]').fill(loginPassword);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: new RegExp(`Ola, ${loginName}`, "i") })).toBeVisible();
  });

  test("sends a reset email and allows login with the new password", async ({
    page,
  }) => {
    await page.goto("/recuperar-senha");

    await page.getByLabel("Email", { exact: true }).fill(loginEmail);
    await page.getByRole("button", { name: "Enviar link de recuperacao" }).click();

    const resetUrl = await waitForResetUrl();

    await page.goto(resetUrl);
    await page.locator('input[name="password"]').fill(newPassword);
    await page.locator('input[name="confirmPassword"]').fill(newPassword);
    await page.getByRole("button", { name: "Salvar nova senha" }).click();

    await expect(page).toHaveURL(/\/login\?reset=success$/);
    await expect(page.getByText("Senha redefinida com sucesso.")).toBeVisible();

    await page.getByLabel("Email", { exact: true }).fill(loginEmail);
    await page.locator('input[name="password"]').fill(newPassword);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: new RegExp(`Ola, ${loginName}`, "i") })).toBeVisible();
  });
});

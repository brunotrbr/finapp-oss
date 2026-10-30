import { expect, test, type Locator, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("e2e@finapp.local");
  await page.getByLabel("Senha").fill("senha-segura");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function tabTo(page: Page, target: Locator) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    await page.keyboard.press("Tab");
    if (await target.evaluate((element) => element === document.activeElement)) return;
  }
  throw new Error("O alvo não foi alcançado por Tab.");
}

test("cria e edita conta e lançamento no modo local", async ({ page }) => {
  await login(page);
  await page.getByRole("link", { name: "Contas" }).click();
  await page.getByRole("link", { name: "Nova conta" }).click();
  await page.getByLabel("Nome da conta").fill("Conta E2E");
  await page.getByLabel(/Instituição financeira/).fill("Banco teste");
  await page.getByLabel("Saldo inicial (R$)").fill("1000");
  await page.getByRole("button", { name: "Salvar conta" }).click();
  await expect(page.getByRole("heading", { name: "Conta E2E" })).toBeVisible();

  await page.getByRole("link", { name: "Editar" }).click();
  await page.getByLabel("Nome da conta").fill("Conta E2E editada");
  await page.getByRole("button", { name: "Salvar conta" }).click();
  await expect(page.getByRole("heading", { name: "Conta E2E editada" })).toBeVisible();
  await page.getByRole("link", { name: "Adicionar lançamento" }).click();
  await expect(page.getByRole("heading", { name: "Novo lançamento" })).toBeVisible();
  await page.getByLabel("Descrição").fill("Compra E2E");
  await page.getByLabel("Valor (R$)").fill("100");
  await page.getByRole("button", { name: "Salvar lançamento" }).click();
  await expect(page.getByRole("heading", { name: "Conta E2E editada" })).toBeVisible();
  await expect(page.getByText("R$ 900,00")).toBeVisible();

  await page.getByRole("link", { name: /Compra E2E/ }).click();
  await expect(page.getByRole("heading", { name: "Compra E2E" })).toBeVisible();
  await page.getByRole("link", { name: "Editar" }).click();
  await expect(page.getByRole("heading", { name: "Editar lançamento" })).toBeVisible();
  await page.getByLabel("Descrição").fill("Compra E2E editada");
  await page.getByRole("button", { name: "Salvar lançamento" }).click();
  await expect(page.getByRole("heading", { name: "Conta E2E editada" })).toBeVisible();
  await page.getByRole("link", { name: /Compra E2E editada/ }).click();
  await page.getByRole("button", { name: "Remover" }).click();
  await page.getByRole("button", { name: "Confirmar" }).click();
  await expect(page.getByText("R$ 1.000,00")).toBeVisible();
});

test("bloqueia exclusão de conta com vínculos sem reclassificar", async ({ page }) => {
  await login(page);
  await page.goto("/dashboard/accounts/account-1");
  await expect(page.getByLabel("Conta de destino")).toHaveCount(0);
  await page.getByRole("button", { name: "Excluir conta" }).click();
  await page.getByRole("button", { name: "Confirmar" }).click();
  await expect(page.getByText(/Remova os vínculos/)).toBeVisible();
});

test("diálogo destrutivo preserva foco e teclado", async ({ page }) => {
  await login(page);
  await page.goto("/dashboard/accounts/account-1");
  const trigger = page.getByRole("button", { name: "Excluir conta" });
  await tabTo(page, trigger);
  await page.keyboard.press("Enter");
  const cancel = page.getByRole("button", { name: "Cancelar" });
  const confirm = page.getByRole("button", { name: "Confirmar" });
  await expect(cancel).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(confirm).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("cria, edita e paga pendência mantendo histórico", async ({ page }) => {
  await login(page);
  await page.goto("/dashboard/bills/new");
  await page.getByLabel("Descrição").fill("Seguro E2E");
  await page.getByLabel("Valor (R$)").fill("50");
  await page.getByRole("button", { name: "Salvar pendência" }).click();
  await page.getByRole("link", { name: /Seguro E2E/ }).click();
  await page.getByRole("link", { name: "Editar" }).click();
  await page.getByLabel("Descrição").fill("Seguro E2E editado");
  await page.getByRole("button", { name: "Salvar pendência" }).click();
  await page.getByRole("link", { name: /Seguro E2E editado/ }).click();
  await page.getByRole("button", { name: "Marcar paga" }).click();
  await page.getByRole("button", { name: "Confirmar" }).click();
  await expect(page.getByRole("status")).toContainText("permanece no histórico");
  await expect(page.getByText("Paga", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Pendências" }).click();
  await expect(page.getByRole("heading", { name: "Pagas" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Seguro E2E editado/ })).toBeVisible();
});

test("fluxo essencial funciona a 320 px sem overflow horizontal", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await login(page);
  await page.goto("/dashboard/bills/new");
  await page.getByLabel("Descrição").fill("Pendência 320");
  await page.getByLabel("Valor (R$)").fill("25");
  await page.getByRole("button", { name: "Salvar pendência" }).click();
  await expect(page.getByRole("link", { name: /Pendência 320/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});

test("dashboard permanece utilizável com zoom de 200%", async ({ page }) => {
  await login(page);
  await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
  await expect(page.getByText(/Olá,/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Contas" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});

test("módulos adiados ficam fora da navegação e rotas redirecionam", async ({ page }) => {
  await login(page);
  await expect(page.getByRole("link", { name: "Cartões" })).toHaveCount(0);
  await page.goto("/dashboard/cards");
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/dashboard/settings/categories");
  await expect(page).toHaveURL(/\/dashboard\/settings$/);
});

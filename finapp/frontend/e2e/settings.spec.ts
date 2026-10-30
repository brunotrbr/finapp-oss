import { expect, test, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("e2e@finapp.local");
  await page.getByLabel("Senha").fill("senha-segura");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("edita perfil em memória e informa o escopo do MVP", async ({ page }) => {
  await login(page);
  await page.goto("/dashboard/settings/profile");
  await page.getByLabel("Nome exibido").fill("Nome E2E");
  await page.getByRole("button", { name: "Salvar nome" }).click();
  await page.getByRole("link", { name: "Finapp Finances" }).click();
  await expect(page.getByText("Olá, Nome E2E")).toBeVisible();
  await page.goto("/dashboard/settings/about");
  await expect(page.getByText(/contas, lançamentos e pendências/)).toBeVisible();
});

test("ajustes não expõem categorias customizáveis nem galeria demonstrativa", async ({ page }) => {
  await login(page);
  await page.goto("/dashboard/settings");
  await expect(page.getByRole("link", { name: /Categorias/ })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Estados do sistema/ })).toHaveCount(0);
});

test("página inexistente usa o estado real de não encontrado", async ({ page }) => {
  await login(page);
  await page.goto("/rota-que-nao-existe");
  await expect(page.getByRole("heading", { name: /não encontrada/i })).toBeVisible();
});

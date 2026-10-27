import { expect, test, type Locator, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("e2e@finapp.local");
  await page.getByLabel("Senha").fill("senha-segura");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function tabTo(page: Page, target: Locator) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await page.keyboard.press("Tab");
    if (await target.evaluate((element) => element === document.activeElement)) return;
  }
  throw new Error("O alvo não foi alcançado por Tab.");
}

test("edita perfil em memória, adiciona categoria e rejeita duplicata", async ({ page }) => {
  await login(page);
  await page.goto("/dashboard/settings/profile");
  await page.getByLabel("Nome exibido").fill("Nome E2E");
  await page.getByRole("button", { name: "Salvar nome" }).click();
  await page.getByRole("link", { name: "Finapp Finances" }).click();
  await expect(page.getByRole("heading", { name: "Minhas Contas" })).toBeVisible();
  await expect(page.getByText("Olá, Nome E2E").first()).toBeVisible();
  await page.goto("/dashboard/settings/categories");
  await page.getByLabel("Nova categoria").fill("Casa nova");
  await page.getByRole("button", { name: "Adicionar categoria" }).click();
  await expect(page.getByText("Casa nova")).toBeVisible();
  await page.getByLabel("Nova categoria").fill("  CASA NOVA  ");
  await page.getByRole("button", { name: "Adicionar categoria" }).click();
  await expect(page.getByText("Esta categoria já existe.")).toBeVisible();
});

test("navega pelos estados somente por teclado e mantém tema, zoom e conteúdo offline", async ({ page, context }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await login(page);
  await expect(page.locator("html")).toHaveCSS("color-scheme", /light/);
  await page.goto("/dashboard/settings/errors/401");
  for (const code of ["403", "404", "500", "offline", "empty"]) {
    const link = page.getByRole("link", { name: code, exact: true });
    await tabTo(page, link);
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: "Estados do sistema" })).toBeVisible();
  }
  await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
  const back = page.getByRole("link", { name: "Voltar ao início" });
  await expect(back).toBeVisible();
  await tabTo(page, back);
  await expect(back).toBeFocused();
  await context.setOffline(true);
  await expect(page.getByRole("heading", { name: "Estados do sistema" })).toBeVisible();
});

test("página inexistente usa o estado real de não encontrado", async ({ page }) => {
  await login(page);
  await page.goto("/rota-que-nao-existe");
  await expect(page.getByRole("heading", { name: /não encontrada/i })).toBeVisible();
});

test("edita e reclassifica categorias com erros associados e protege Outros", async ({ page }) => {
  await login(page);
  await page.goto("/dashboard/settings/categories");
  await expect(page.getByText("Categoria do sistema")).toBeVisible();
  await expect(page.getByRole("button", { name: "Editar Outros" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Excluir Outros" })).toHaveCount(0);

  await page.getByRole("button", { name: "Editar Moradia" }).click();
  const edit = page.getByLabel("Nome da categoria");
  await edit.fill("Alimentação");
  await page.getByRole("button", { name: "Salvar categoria" }).click();
  await expect(edit).toHaveAttribute("aria-invalid", "true");
  await page.getByRole("button", { name: "Cancelar edição" }).click();

  await page.getByRole("button", { name: "Excluir Moradia" }).click();
  const destination = page.getByLabel("Reclassificar como");
  await page.getByRole("button", { name: "Confirmar exclusão" }).click();
  await expect(destination).toHaveAttribute("aria-invalid", "true");
  await destination.selectOption("Outros");
  await page.getByRole("button", { name: "Confirmar exclusão" }).click();
  await expect(page.getByRole("status")).toContainText("Categoria excluída");
});

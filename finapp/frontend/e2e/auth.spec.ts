import { expect, test, type Locator, type Page } from "@playwright/test";

async function tabTo(page: Page, target: Locator) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await page.keyboard.press("Tab");
    if (await target.evaluate((element) => element === document.activeElement)) return;
  }
  throw new Error("O alvo não foi alcançado por Tab.");
}

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("e2e@finapp.local");
  await page.getByLabel("Senha").fill("senha-segura");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("sessão ausente redireciona dashboard para login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Bem-vindo de volta" })).toBeVisible();
});

test("cookie adulterado não libera conteúdo protegido", async ({ context, page }) => {
  await context.addCookies([{ name: "__session", value: "invalido", domain: "127.0.0.1", path: "/" }]);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Bem-vindo de volta" })).toBeVisible();
});

test("login é utilizável em viewport estreito", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/login");
  await expect(page.getByLabel("E-mail")).toBeVisible();
  await expect(page.getByLabel("Senha")).toBeVisible();
  await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
  const registerBox = await page.getByRole("button", { name: /Cadastre-se/ }).boundingBox();
  const resetBox = await page.getByRole("link", { name: "Esqueci minha senha" }).boundingBox();
  expect(registerBox?.height).toBeGreaterThanOrEqual(44);
  expect(resetBox?.height).toBeGreaterThanOrEqual(44);
});

test("login controlado cria sessão e sessão válida não reabre o login", async ({ page }) => {
  await login(page);
  await page.goto("/login");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Visão geral" })).toBeVisible();
  await expect(page.getByText("Olá, Pessoa de teste").first()).toBeVisible();
});

test("login completo pode ser operado somente por teclado", async ({ page }) => {
  await page.goto("/login");
  const email = page.getByLabel("E-mail");
  const password = page.getByLabel("Senha");
  const submit = page.getByRole("button", { name: "Entrar" });
  await tabTo(page, email);
  await page.keyboard.type("teclado@finapp.local");
  await tabTo(page, password);
  await page.keyboard.type("senha-segura");
  await tabTo(page, submit);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("logout encerra cliente e sessão servidor antes de voltar ao login", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: "Abrir menu do usuário" }).click();
  await page.getByRole("menuitem", { name: "Encerrar sessão" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
});

test("cadastro controlado preserva o fluxo próprio de e-mail e senha", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Cadastre-se/ }).click();
  await page.getByLabel("E-mail").fill("nova@finapp.local");
  await page.getByLabel("Senha").fill("senha-segura");
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("login Google controlado usa sua ação dedicada", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Continuar com Google" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("recuperação responde de forma genérica", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("link", { name: "Esqueci minha senha" }).click();
  await expect(page).toHaveURL(/\/forgot-password$/);
  await page.getByLabel("E-mail cadastrado").fill("desconhecido@finapp.local");
  await page.getByRole("button", { name: "Enviar link de recuperação" }).click();
  await expect(page.getByRole("status")).toContainText("Se houver uma conta");
});

test("deep link de redefinição inválido é seguro e responsivo", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/reset-password");
  await expect(page.getByRole("heading", { name: "Crie uma nova senha" })).toBeVisible();
  await expect(page.getByRole("alert").filter({ hasText: "Link de recuperação inválido" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Voltar para entrar" })).toBeVisible();
  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(hasHorizontalOverflow).toBe(false);
});

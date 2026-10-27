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

test("cria e edita conta, lança, filtra, recalcula, remove e restaura fixtures no refresh", async ({ page }) => {
  await login(page);
  await page.getByRole("link", { name: "Contas" }).click();
  await page.getByRole("link", { name: "Nova conta" }).click();
  await page.getByLabel("Nome da conta").fill("Conta E2E");
  await page.getByLabel("Instituição").fill("Banco teste");
  await page.getByLabel("Saldo inicial (R$)").fill("1000");
  await page.getByRole("button", { name: "Salvar conta" }).click();
  await expect(page.getByRole("heading", { name: "Conta E2E" })).toBeVisible({ timeout: 15_000 });

  await page.getByRole("link", { name: "Editar" }).click();
  await page.getByLabel("Nome da conta").fill("Conta E2E editada");
  await page.getByRole("button", { name: "Salvar conta" }).click();
  await page.getByRole("link", { name: "Adicionar lançamento" }).click();
  await page.getByLabel("Descrição").fill("Compra E2E");
  await page.getByLabel("Valor (R$)").fill("100");
  await page.getByRole("button", { name: "Salvar lançamento" }).click();
  await expect(page.getByText("R$ 900,00")).toBeVisible();
  await page.getByLabel("Período").selectOption("2026-09");
  await expect(page.getByText("Nenhum lançamento no período.")).toBeVisible();
  await page.getByLabel("Período").selectOption("all");
  await page.getByRole("link", { name: /Compra E2E/ }).click();
  await expect(page.getByRole("heading", { name: "Compra E2E" })).toBeVisible();
  await page.getByRole("link", { name: "Editar" }).click();
  await page.getByLabel("Descrição").fill("Compra E2E editada");
  await page.getByRole("button", { name: "Salvar lançamento" }).click();
  await expect(page.getByRole("heading", { name: "Conta E2E editada" })).toBeVisible();
  await page.getByRole("link", { name: /Compra E2E editada/ }).click();
  await page.getByRole("button", { name: "Remover" }).click();
  await page.getByRole("button", { name: "Confirmar" }).click();
  await expect(page.getByText("R$ 1.000,00")).toBeVisible();

  await page.reload();
  await expect(page.getByText(/Conta não encontrado ou removido/)).toBeVisible();
});

test("bloqueia exclusão de conta com vínculos sem apagar pendências", async ({ page }) => {
  await login(page);
  await page.goto("/dashboard/accounts/account-1");
  await page.getByRole("button", { name: "Excluir conta" }).click();
  await page.getByRole("button", { name: "Confirmar" }).click();
  await expect(page.getByText(/Remova os lançamentos e as pendências/)).toBeVisible();
  await page.goto("/dashboard/bills");
  await expect(page.getByRole("link", { name: /Internet/ })).toBeVisible();
});

test("diálogo destrutivo funciona com Tab, Shift+Tab, Enter e Escape", async ({ page }) => {
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

test("cria pendência, cancela e confirma um único pagamento com recálculo", async ({ page }) => {
  await login(page);
  await page.goto("/dashboard/bills/new");
  await page.getByLabel("Descrição").fill("Seguro E2E");
  await page.getByLabel("Valor (R$)").fill("50");
  await page.getByRole("button", { name: "Salvar pendência" }).click();
  await expect(page.getByText("R$ 380,00")).toBeVisible();
  await page.getByRole("link", { name: /Seguro E2E/ }).click();
  await page.getByRole("button", { name: "Marcar paga" }).click();
  await page.getByRole("button", { name: "Cancelar" }).click();
  await expect(page.getByRole("heading", { name: "Seguro E2E" })).toBeVisible();
  await page.getByRole("button", { name: "Marcar paga" }).click();
  await page.getByRole("button", { name: "Confirmar" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("R$ 330,00")).toBeVisible();
});

test("conclui fluxo financeiro representativo a 320 px sem overflow horizontal", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await login(page);
  await page.goto("/dashboard/bills/new");
  await page.getByLabel("Descrição").fill("Pendência 320");
  await page.getByLabel("Valor (R$)").fill("25");
  await page.getByRole("button", { name: "Salvar pendência" }).click();
  await expect(page.getByRole("link", { name: /Pendência 320/ })).toBeVisible();
  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(hasHorizontalOverflow).toBe(false);
});

test("mantém validação inválida no formulário e associa erro ao campo", async ({ page }) => {
  await login(page);
  await page.goto("/dashboard/settings/categories");
  const input = page.getByLabel("Nova categoria");
  await input.fill("  ALIMENTAÇÃO  ");
  await page.getByRole("button", { name: "Adicionar categoria" }).click();
  const alert = page.getByText("Esta categoria já existe.", { exact: true });
  await expect(alert).toContainText("já existe");
  await expect(input).toHaveAttribute("aria-invalid", "true");
  const describedBy = await input.getAttribute("aria-describedby");
  expect(describedBy).toBeTruthy();
  await expect(page.locator(`#${describedBy}`)).toHaveText(/já existe/);
});

test("cria cartão e compra parcelada, mostra detalhe e exclui após confirmação", async ({ page }) => {
  await login(page);
  await page.goto("/dashboard/cards/new");
  await page.getByLabel("Nome").fill("Cartão E2E");
  await page.getByLabel("Limite (R$)").fill("2000");
  await page.getByRole("button", { name: "Salvar cartão" }).click();
  await page.getByRole("link", { name: "Nova compra" }).click();
  await page.getByLabel("Descrição").fill("Curso E2E");
  await page.getByLabel("Valor total (R$)").fill("600");
  await page.getByLabel("Parcelas").fill("3");
  await page.getByRole("button", { name: "Salvar compra" }).click();
  await page.getByRole("link", { name: /Curso E2E/ }).click();
  await expect(page.locator("p").filter({ hasText: "3x de" })).toContainText("200,00");
  await page.getByRole("button", { name: "Excluir compra" }).click();
  await page.getByRole("button", { name: "Confirmar" }).click();
  await expect(page.getByText("Nenhuma compra neste cartão.")).toBeVisible();
});

test("reclassifica vínculos, confirma a exclusão uma vez e neutraliza refresh", async ({ page }) => {
  await login(page);
  await page.goto("/dashboard/accounts/account-1");
  await page.getByLabel("Conta de destino").selectOption("account-2");
  await page.getByRole("button", { name: "Excluir conta" }).click();
  await page.getByRole("button", { name: "Confirmar" }).click();
  await expect(page).toHaveURL(/\/dashboard\/accounts\/deletion-success$/);
  await expect(page.getByRole("heading", { name: "Conta excluída" })).toBeVisible();
  await expect(page.getByText(/reclassificados para Reserva/)).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: "Nenhuma exclusão recente" })).toBeVisible();
});

test("paga fatura uma vez e não oferece ação para ciclo vazio", async ({ page }) => {
  await login(page);
  await page.goto("/dashboard/cards/card-1/invoice");
  await expect(page.getByText("Parcela 1 de 3")).toBeVisible();
  await page.getByLabel("Conta para pagamento").selectOption("account-1");
  await page.getByRole("button", { name: "Pagar fatura" }).click();
  await page.getByRole("button", { name: "Confirmar" }).click();
  await expect(page.getByRole("status")).toContainText("Fatura paga");
  await expect(page.getByRole("button", { name: "Fatura paga" })).toBeDisabled();

  await page.goto("/dashboard/cards/new");
  await page.getByLabel("Nome").fill("Cartão sem compras");
  await page.getByLabel("Limite (R$)").fill("1000");
  await page.getByRole("button", { name: "Salvar cartão" }).click();
  await page.getByRole("link", { name: "Ver fatura" }).click();
  await expect(page.getByText("Nenhum lançamento neste ciclo.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Pagar fatura" })).toHaveCount(0);
});

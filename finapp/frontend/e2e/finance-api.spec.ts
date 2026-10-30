import { expect, test, type Page } from "@playwright/test";

test.skip(process.env.NEXT_PUBLIC_FINAPP_DATA_SOURCE !== "api", "Executed with the dedicated API-interception environment.");

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("e2e@finapp.local");
  await page.getByLabel("Senha").fill("senha-segura");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("API interceptada carrega os dados remotos sem fallback demo", async ({ page }) => {
  const requested: string[] = [];
  await page.route("https://api.e2e.test/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    requested.push(`${route.request().method()} ${url.pathname}`);
    if (url.pathname === "/api/v1/accounts") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [{ id: "remote-account", name: "Conta somente API", bank: null, type: "Corrente", initialBalanceCents: 12345, currency: "BRL" }],
          nextCursor: null,
        }),
      });
      return;
    }
    if (url.pathname.endsWith("/transactions") || url.pathname.endsWith("/bills")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [], nextCursor: null }) });
      return;
    }
    await route.fulfill({ status: 404, contentType: "application/problem+json", body: "{}" });
  });

  await login(page);
  await page.getByRole("link", { name: "Contas" }).click();

  await expect.poll(() => requested).toContain("GET /api/v1/accounts");
  await expect(page.getByRole("link", { name: /Conta somente API/ })).toBeVisible();
  await expect(page.getByText("Conta principal")).toHaveCount(0);
  expect(requested).toEqual(expect.arrayContaining([
    "GET /api/v1/accounts",
    "GET /api/v1/accounts/remote-account/transactions",
    "GET /api/v1/accounts/remote-account/bills",
  ]));
});

test("API 422 associa o erro conhecido ao campo de conta", async ({ page }) => {
  const methods: string[] = [];
  await page.route("https://api.e2e.test/api/v1/**", async (route) => {
    const request = route.request();
    methods.push(request.method());
    if (request.method() === "GET") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [], nextCursor: null }) });
      return;
    }
    await route.fulfill({
      status: 422,
      contentType: "application/problem+json",
      body: JSON.stringify({ code: "validation_failed", errors: { name: ["Este nome não pode ser usado."] } }),
    });
  });

  await login(page);
  await page.goto("/dashboard/accounts/new");
  await page.getByLabel("Nome da conta").fill("Conta inválida");
  await page.getByRole("button", { name: "Salvar conta" }).click();

  await expect(page.getByLabel("Nome da conta")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText("Este nome não pode ser usado.", { exact: true })).toBeVisible();
  expect(methods.at(-1)).toBe("POST");
  expect(methods.filter((method) => method === "POST")).toHaveLength(1);
});

test("API 401 informa sessão expirada sem usar dados demo", async ({ page }) => {
  const requests: string[] = [];
  await page.route("https://api.e2e.test/api/v1/**", async (route) => {
    requests.push(route.request().headers().authorization || "");
    await route.fulfill({
      status: 401,
      contentType: "application/problem+json",
      body: JSON.stringify({ code: "session_expired" }),
    });
  });

  await login(page);

  await expect(page.getByRole("heading", { name: "Não foi possível carregar seu dashboard" })).toBeVisible();
  await expect(page.getByText("Sua sessão expirou. Entre novamente.")).toBeVisible();
  await expect(page.getByText("Conta principal")).toHaveCount(0);
  expect(requests.length).toBeGreaterThan(0);
  expect(requests[0]).toBe("Bearer finapp-e2e-token");
});

test("API 409 mantém a conta vinculada e explica o conflito", async ({ page }) => {
  await page.route("https://api.e2e.test/api/v1/**", async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    if (request.method() === "DELETE") {
      await route.fulfill({
        status: 409,
        contentType: "application/problem+json",
        body: JSON.stringify({ code: "account_has_dependencies" }),
      });
    } else if (pathname === "/api/v1/accounts") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [{ id: "remote-account", name: "Conta vinculada", bank: null, type: "Corrente", initialBalanceCents: 50000, currency: "BRL" }], nextCursor: null }),
      });
    } else {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [], nextCursor: null }) });
    }
  });

  await login(page);
  await page.goto("/dashboard/accounts/remote-account");
  await page.getByRole("button", { name: "Excluir conta" }).click();
  await page.getByRole("button", { name: "Confirmar" }).click();

  await expect(page.getByText(/Esta conta possui lançamentos/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Conta vinculada" })).toBeVisible();
});

test("API confirma criação, edição e exclusão de conta antes de atualizar a interface", async ({ page }) => {
  const methods: string[] = [];
  let account: Record<string, unknown> | null = null;
  await page.route("https://api.e2e.test/api/v1/**", async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    methods.push(`${request.method()} ${pathname}`);
    if (request.method() === "GET") {
      if (pathname === "/api/v1/accounts") {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: account ? [account] : [], nextCursor: null }) });
      } else {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [], nextCursor: null }) });
      }
      return;
    }
    if (request.method() === "POST") {
      const body = request.postDataJSON() as Record<string, unknown>;
      account = { ...body, id: "created-account", balanceCents: body.initialBalanceCents, currency: "BRL" };
      await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(account) });
      return;
    }
    if (request.method() === "PATCH") {
      account = { ...account, ...(request.postDataJSON() as Record<string, unknown>) };
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(account) });
      return;
    }
    account = null;
    await route.fulfill({ status: 204 });
  });

  await login(page);
  await page.goto("/dashboard/accounts/new");
  await page.getByLabel("Nome da conta").fill("Conta API");
  await page.getByLabel("Saldo inicial (R$)").fill("1250.75");
  await page.getByRole("button", { name: "Salvar conta" }).click();
  await expect(page.getByRole("heading", { name: "Conta API" })).toBeVisible();

  await page.getByRole("link", { name: "Editar" }).click();
  await page.getByLabel("Nome da conta").fill("Conta API editada");
  await page.getByRole("button", { name: "Salvar conta" }).click();
  await expect(page.getByRole("heading", { name: "Conta API editada" })).toBeVisible();

  await page.getByRole("button", { name: "Excluir conta" }).click();
  await page.getByRole("button", { name: "Confirmar" }).click();
  await expect(page.getByRole("heading", { name: "Conta excluída" })).toBeVisible();
  expect(methods).toEqual(expect.arrayContaining([
    "POST /api/v1/accounts",
    "PATCH /api/v1/accounts/created-account",
    "DELETE /api/v1/accounts/created-account",
  ]));
});

test("API confirma criação, edição e exclusão de lançamento", async ({ page }) => {
  const methods: string[] = [];
  let transaction: Record<string, unknown> | null = null;
  await page.route("https://api.e2e.test/api/v1/**", async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    methods.push(`${request.method()} ${pathname}`);
    if (request.method() === "GET") {
      if (pathname === "/api/v1/accounts") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ items: [{ id: "remote-account", name: "Conta API", bank: null, type: "Corrente", initialBalanceCents: 100000, currency: "BRL" }], nextCursor: null }),
        });
      } else {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [], nextCursor: null }) });
      }
      return;
    }
    if (request.method() === "POST") {
      const body = request.postDataJSON() as Record<string, unknown>;
      transaction = { ...body, id: "remote-transaction", currency: "BRL" };
      await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(transaction) });
      return;
    }
    if (request.method() === "PATCH") {
      transaction = { ...transaction, ...(request.postDataJSON() as Record<string, unknown>) };
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(transaction) });
      return;
    }
    transaction = null;
    await route.fulfill({ status: 204 });
  });

  await login(page);
  await page.goto("/dashboard/transactions/new?account=remote-account");
  await page.getByLabel("Descrição").fill("Compra API");
  await page.getByLabel("Valor (R$)").fill("45.50");
  await page.getByRole("button", { name: "Salvar lançamento" }).click();
  await expect(page.getByRole("link", { name: /Compra API/ })).toBeVisible();

  await page.getByRole("link", { name: /Compra API/ }).click();
  await expect(page.getByRole("heading", { name: "Compra API" })).toBeVisible();
  await page.getByRole("link", { name: "Editar" }).click();
  await expect(page.getByRole("heading", { name: "Editar lançamento" })).toBeVisible();
  await page.getByLabel("Descrição").fill("Compra API editada");
  await page.getByRole("button", { name: "Salvar lançamento" }).click();
  await expect(page.getByRole("link", { name: /Compra API editada/ })).toBeVisible();

  await page.getByRole("link", { name: /Compra API editada/ }).click();
  await page.getByRole("button", { name: "Remover" }).click();
  await page.getByRole("button", { name: "Confirmar" }).click();
  await expect(page.getByRole("link", { name: /Compra API editada/ })).toHaveCount(0);
  expect(methods).toEqual(expect.arrayContaining([
    "POST /api/v1/transactions",
    "PATCH /api/v1/transactions/remote-transaction",
    "DELETE /api/v1/transactions/remote-transaction",
  ]));
});

test("API confirma criação, edição e exclusão de pendência", async ({ page }) => {
  const methods: string[] = [];
  let bill: Record<string, unknown> | null = null;
  await page.route("https://api.e2e.test/api/v1/**", async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    methods.push(`${request.method()} ${pathname}`);
    if (request.method() === "GET") {
      if (pathname === "/api/v1/accounts") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ items: [{ id: "remote-account", name: "Conta API", bank: null, type: "Corrente", initialBalanceCents: 100000, currency: "BRL" }], nextCursor: null }),
        });
      } else {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [], nextCursor: null }) });
      }
      return;
    }
    if (request.method() === "POST") {
      const body = request.postDataJSON() as Record<string, unknown>;
      bill = { ...body, id: "remote-bill", status: "open", paidOn: null, paymentTransactionId: null, currency: "BRL" };
      await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(bill) });
      return;
    }
    if (request.method() === "PATCH") {
      bill = { ...bill, ...(request.postDataJSON() as Record<string, unknown>) };
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(bill) });
      return;
    }
    bill = null;
    await route.fulfill({ status: 204 });
  });

  await login(page);
  await page.goto("/dashboard/bills/new");
  await page.getByLabel("Descrição").fill("Seguro API");
  await page.getByLabel("Valor (R$)").fill("75.25");
  await page.getByRole("button", { name: "Salvar pendência" }).click();
  await expect(page.getByRole("link", { name: /Seguro API/ })).toBeVisible();

  await page.getByRole("link", { name: /Seguro API/ }).click();
  await expect(page.getByRole("heading", { name: "Seguro API" })).toBeVisible();
  await page.getByRole("link", { name: "Editar" }).click();
  await page.getByLabel("Descrição").fill("Seguro API editado");
  await page.getByRole("button", { name: "Salvar pendência" }).click();
  await expect(page.getByRole("link", { name: /Seguro API editado/ })).toBeVisible();

  await page.getByRole("link", { name: /Seguro API editado/ }).click();
  await page.getByRole("button", { name: "Remover" }).click();
  await page.getByRole("button", { name: "Confirmar" }).click();
  await expect(page.getByRole("link", { name: /Seguro API editado/ })).toHaveCount(0);
  expect(methods).toEqual(expect.arrayContaining([
    "POST /api/v1/bills",
    "PATCH /api/v1/bills/remote-bill",
    "DELETE /api/v1/bills/remote-bill",
  ]));
});

test("timeout e retry mantêm a chave no mesmo payload e trocam após edição", async ({ page }) => {
  const keys: string[] = [];
  let submissions = 0;
  await page.route("https://api.e2e.test/api/v1/**", async (route) => {
    const request = route.request();
    if (request.method() === "GET") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [], nextCursor: null }) });
      return;
    }

    submissions += 1;
    keys.push(request.headers()["idempotency-key"]);
    if (submissions === 1) {
      await new Promise((resolve) => setTimeout(resolve, 11_000));
      try {
        await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({}) });
      } catch {
        // The browser has already aborted this request due to the client timeout.
      }
      return;
    }
    if (submissions === 2) {
      await route.fulfill({ status: 503, contentType: "application/problem+json", body: JSON.stringify({ code: "temporary_failure" }) });
      return;
    }
    const body = request.postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ ...body, id: "retried-account", balanceCents: body.initialBalanceCents, currency: "BRL" }),
    });
  });

  await login(page);
  await page.goto("/dashboard/accounts/new");
  await page.getByLabel("Nome da conta").fill("Conta com timeout");
  await page.getByRole("button", { name: "Salvar conta" }).click();
  await expect(page.getByText(/Não foi possível conectar ao serviço financeiro/)).toBeVisible({ timeout: 15_000 });

  await page.getByRole("button", { name: "Salvar conta" }).click();
  await expect(page.getByText("O serviço financeiro está temporariamente indisponível.")).toBeVisible();
  await page.getByLabel("Nome da conta").fill("Conta corrigida");
  await page.getByRole("button", { name: "Salvar conta" }).click();

  await expect(page.getByRole("heading", { name: "Conta corrigida" })).toBeVisible();
  expect(submissions).toBe(3);
  expect(keys[0]).toBeTruthy();
  expect(keys[1]).toBe(keys[0]);
  expect(keys[2]).not.toBe(keys[0]);
});

test("pagamento desabilita novo envio enquanto a API não responde", async ({ page }) => {
  let releasePayment!: () => void;
  let signalPayment!: () => void;
  const paymentGate = new Promise<void>((resolve) => { releasePayment = resolve; });
  const paymentStarted = new Promise<void>((resolve) => { signalPayment = resolve; });
  let paymentRequests = 0;
  await page.route("https://api.e2e.test/api/v1/**", async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    if (request.method() === "GET" && pathname === "/api/v1/accounts") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [{ id: "remote-account", name: "Conta API", bank: null, type: "Corrente", initialBalanceCents: 100000, currency: "BRL" }], nextCursor: null }),
      });
      return;
    }
    if (request.method() === "GET" && pathname.endsWith("/bills")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [{ id: "remote-bill", accountId: "remote-account", description: "Aluguel API", amountCents: 40000, dueDate: "2026-10-30", status: "open", paidOn: null, paymentTransactionId: null, currency: "BRL" }], nextCursor: null }),
      });
      return;
    }
    if (request.method() === "GET") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [], nextCursor: null }) });
      return;
    }

    paymentRequests += 1;
    signalPayment();
    await paymentGate;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        bill: { id: "remote-bill", accountId: "remote-account", description: "Aluguel API", amountCents: 40000, dueDate: "2026-10-30", status: "paid", paidOn: "2026-10-29", paymentTransactionId: "payment-1", currency: "BRL" },
        transaction: { id: "payment-1", accountId: "remote-account", description: "Aluguel API", amountCents: -40000, date: "2026-10-29", category: "Outros", note: "Pagamento de pendência", currency: "BRL" },
      }),
    });
  });

  await login(page);
  await page.goto("/dashboard/bills/remote-bill");
  await page.getByRole("button", { name: "Marcar paga" }).click();
  await page.getByRole("button", { name: "Confirmar" }).click();
  await paymentStarted;
  try {
    const submitting = page.getByRole("button", { name: "Registrando…" });
    await expect(submitting).toBeDisabled();
    expect(paymentRequests).toBe(1);
  } finally {
    releasePayment();
  }

  await expect(page.getByRole("status")).toContainText("Pagamento registrado");
  await expect(page.getByText("Paga", { exact: true })).toBeVisible();
});

test("retry de pagamento reutiliza a chave apenas enquanto conta e data não mudam", async ({ page }) => {
  const keys: string[] = [];
  let submissions = 0;
  await page.route("https://api.e2e.test/api/v1/**", async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    if (request.method() === "GET" && pathname === "/api/v1/accounts") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [{ id: "remote-account", name: "Conta API", bank: null, type: "Corrente", initialBalanceCents: 100000, currency: "BRL" }], nextCursor: null }),
      });
      return;
    }
    if (request.method() === "GET" && pathname.endsWith("/bills")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [{ id: "remote-bill", accountId: "remote-account", description: "Aluguel API", amountCents: 40000, dueDate: "2026-10-30", status: "open", paidOn: null, paymentTransactionId: null, currency: "BRL" }], nextCursor: null }),
      });
      return;
    }
    if (request.method() === "GET") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [], nextCursor: null }) });
      return;
    }

    submissions += 1;
    keys.push(request.headers()["idempotency-key"]);
    if (submissions < 3) {
      await route.fulfill({ status: 503, contentType: "application/problem+json", body: JSON.stringify({ code: "temporary_failure" }) });
      return;
    }
    const input = request.postDataJSON() as { accountId: string; paidOn: string };
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        bill: { id: "remote-bill", accountId: input.accountId, description: "Aluguel API", amountCents: 40000, dueDate: "2026-10-30", status: "paid", paidOn: input.paidOn, paymentTransactionId: "payment-1", currency: "BRL" },
        transaction: { id: "payment-1", accountId: input.accountId, description: "Aluguel API", amountCents: -40000, date: input.paidOn, category: "Outros", note: "Pagamento de pendência", currency: "BRL" },
      }),
    });
  });

  await login(page);
  await page.goto("/dashboard/bills/remote-bill");
  await page.getByRole("button", { name: "Marcar paga" }).click();
  await page.getByRole("button", { name: "Confirmar" }).click();
  await expect(page.getByText("O serviço financeiro está temporariamente indisponível.")).toBeVisible();

  await page.getByRole("button", { name: "Marcar paga" }).click();
  await page.getByRole("button", { name: "Confirmar" }).click();
  await expect(page.getByText("O serviço financeiro está temporariamente indisponível.")).toBeVisible();
  await page.getByLabel("Data do pagamento").fill("2026-10-28");
  await page.getByRole("button", { name: "Marcar paga" }).click();
  await page.getByRole("button", { name: "Confirmar" }).click();

  await expect(page.getByRole("status")).toContainText("Pagamento registrado");
  expect(submissions).toBe(3);
  expect(keys[1]).toBe(keys[0]);
  expect(keys[2]).not.toBe(keys[0]);
});

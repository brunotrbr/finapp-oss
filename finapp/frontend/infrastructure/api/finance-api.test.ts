import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createRemoteAccount, createRemoteBill, createRemoteTransaction,
  deleteRemoteAccount, deleteRemoteBill, deleteRemoteTransaction,
  loadFinanceState, payRemoteBill, updateRemoteAccount, updateRemoteBill, updateRemoteTransaction,
} from "./finance-api";

const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json" } });
const account = { id: "account-1", name: "Principal", bank: "Banco", type: "Corrente", initialBalanceCents: 10000, balanceCents: 12500, currency: "BRL" };

describe("loadFinanceState", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("busca somente o núcleo do MVP, usa token em cada request e hidrata atomicamente", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.test");
    const calls: string[] = [];
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      calls.push(url);
      expect((init?.headers as Record<string, string>).Authorization).toMatch(/^Bearer token-/);
      if (url.endsWith("/accounts")) return json({ items: [account], nextCursor: null });
      if (url.includes("/accounts/account-1/transactions")) return json({ items: [{ id: "transaction-1", accountId: "account-1", description: "Entrada", amountCents: 2500, date: "2026-10-05", category: "Trabalho", note: "", currency: "BRL" }], nextCursor: null });
      if (url.includes("/accounts/account-1/bills")) return json({ items: [], nextCursor: null });
      return json({}, 404);
    });
    vi.stubGlobal("fetch", fetchMock);
    let tokenNumber = 0;

    const state = await loadFinanceState({ displayName: "Ana", getToken: async () => `token-${++tokenNumber}` });

    expect(state.accounts).toHaveLength(1);
    expect(state.transactions[0].amount).toBe(25);
    expect(calls).toEqual(expect.arrayContaining([
      "https://api.example.test/api/v1/accounts",
      "https://api.example.test/api/v1/accounts/account-1/transactions",
      "https://api.example.test/api/v1/accounts/account-1/bills",
    ]));
    expect(calls.some((url) => url.includes("/cards"))).toBe(false);
    expect(state.cards).toEqual([]);
    expect(tokenNumber).toBe(3);
  });

  it("rejeita toda a hidratação quando uma resposta parcial é inválida", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.test");
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.endsWith("/accounts")) return json({ items: [account], nextCursor: null });
      if (url.includes("/transactions")) return json({ items: [], nextCursor: null });
      return json({ items: [{ id: "bill-1", accountId: "missing", description: "Inválida", amountCents: 100, dueDate: "2026-10-20", currency: "BRL" }], nextCursor: null });
    }));

    await expect(loadFinanceState({ displayName: "Ana", getToken: async () => "token" })).rejects.toThrow(/conta inexistente/i);
  });

  it("reutiliza a chave de idempotência fornecida pela submissão", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.test");
    const fetchMock = vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
      expect((init?.headers as Record<string, string>)["Idempotency-Key"]).toBe("stable-submission-key");
      return json(account, 201);
    });
    vi.stubGlobal("fetch", fetchMock);

    await createRemoteAccount(
      { name: "Principal", bank: "Banco", type: "Corrente", initialBalance: 100 },
      { displayName: "Ana", getToken: async () => "token" },
      "stable-submission-key",
    );

    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("cria lançamento em centavos no contrato aprovado", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.test");
    const response = { id: "transaction-2", accountId: "account-1", description: "Mercado", amountCents: -2599, date: "2026-10-20", category: "Alimentação", note: "", currency: "BRL" };
    const fetchMock = vi.fn().mockResolvedValue(json(response, 201));
    vi.stubGlobal("fetch", fetchMock);

    await createRemoteTransaction({ accountId: "account-1", description: "Mercado", amount: -25.99, date: "2026-10-20", category: "Alimentação", note: "" }, { displayName: "Ana", getToken: async () => "token" }, "transaction-key");

    expect(fetchMock).toHaveBeenCalledWith("https://api.example.test/api/v1/transactions", expect.objectContaining({ method: "POST" }));
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(String(init.body))).toEqual(expect.objectContaining({ amountCents: -2599 }));
  });

  it("paga pendência com chave estável e mapeia pendência e débito", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.test");
    const response = {
      bill: { id: "bill-1", accountId: "account-1", description: "Internet", amountCents: 12000, dueDate: "2026-10-22", status: "paid", paidOn: "2026-10-18", paymentTransactionId: "payment-1", currency: "BRL" },
      transaction: { id: "payment-1", accountId: "account-1", description: "Internet", amountCents: -12000, date: "2026-10-18", category: "Outros", note: "Pagamento de pendência", currency: "BRL" },
    };
    const fetchMock = vi.fn().mockResolvedValue(json(response));
    vi.stubGlobal("fetch", fetchMock);

    const result = await payRemoteBill("bill-1", { accountId: "account-1", paidOn: "2026-10-18" }, { displayName: "Ana", getToken: async () => "token" }, "payment-key");

    expect(result.bill.status).toBe("paid");
    expect(result.transaction.amount).toBe(-120);
    expect(fetchMock).toHaveBeenCalledWith("https://api.example.test/api/v1/bills/bill-1/payments", expect.objectContaining({ method: "POST" }));
  });

  it("cobre PATCH e DELETE dos agregados do MVP", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.test");
    const transaction = { id: "transaction-1", accountId: "account-1", description: "Ajuste", amountCents: -1000, date: "2026-10-20", category: "Outros", note: "", currency: "BRL" };
    const bill = { id: "bill-1", accountId: "account-1", description: "Conta", amountCents: 2000, dueDate: "2026-10-30", status: "open", paidOn: null, paymentTransactionId: null, currency: "BRL" };
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      if (init?.method === "DELETE") return new Response(null, { status: 204 });
      const url = String(input);
      if (url.includes("/accounts/")) return json({ ...account, bank: null });
      if (url.includes("/transactions/")) return json(transaction);
      return json(bill);
    });
    vi.stubGlobal("fetch", fetchMock);
    const options = { displayName: "Ana", getToken: async () => "token" };

    await updateRemoteAccount("account-1", { name: "Carteira", bank: "", type: "Carteira", initialBalance: 100 }, options);
    await deleteRemoteAccount("account-1", options);
    await updateRemoteTransaction("transaction-1", { accountId: "account-1", description: "Ajuste", amount: -10, date: "2026-10-20", category: "Outros", note: "" }, options);
    await deleteRemoteTransaction("transaction-1", options);
    await createRemoteBill({ accountId: "account-1", description: "Conta", amount: 20, dueDate: "2026-10-30" }, options, "bill-key");
    await updateRemoteBill("bill-1", { accountId: "account-1", description: "Conta", amount: 20, dueDate: "2026-10-30" }, options);
    await deleteRemoteBill("bill-1", options);

    expect(fetchMock.mock.calls.map(([url, init]) => [String(url).replace("https://api.example.test", ""), (init as RequestInit).method])).toEqual([
      ["/api/v1/accounts/account-1", "PATCH"],
      ["/api/v1/accounts/account-1", "DELETE"],
      ["/api/v1/transactions/transaction-1", "PATCH"],
      ["/api/v1/transactions/transaction-1", "DELETE"],
      ["/api/v1/bills", "POST"],
      ["/api/v1/bills/bill-1", "PATCH"],
      ["/api/v1/bills/bill-1", "DELETE"],
    ]);
    expect((fetchMock.mock.calls[4][1]?.headers as Record<string, string>)["Idempotency-Key"]).toBe("bill-key");
  });
});

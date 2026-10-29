import { afterEach, describe, expect, it, vi } from "vitest";
import { createRemoteAccount, loadFinanceState } from "./finance-api";

const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json" } });
const account = { id: "account-1", name: "Principal", bank: "Banco", type: "Corrente", initialBalanceCents: 10000, balanceCents: 12500, currency: "BRL" };
const card = { id: "card-1", name: "Principal", limitCents: 500000, closingDay: 20, dueDay: 28, currency: "BRL" };

describe("loadFinanceState", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("busca as raízes em paralelo, usa token em cada request e hidrata atomicamente", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.test");
    const calls: string[] = [];
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      calls.push(url);
      expect((init?.headers as Record<string, string>).Authorization).toMatch(/^Bearer token-/);
      if (url.endsWith("/accounts")) return json({ items: [account], nextCursor: null });
      if (url.endsWith("/cards")) return json({ items: [card], nextCursor: null });
      if (url.includes("/accounts/account-1/transactions")) return json({ items: [{ id: "transaction-1", accountId: "account-1", description: "Entrada", amountCents: 2500, date: "2026-10-05", category: "Trabalho", note: "", currency: "BRL" }], nextCursor: null });
      if (url.includes("/accounts/account-1/bills")) return json({ items: [], nextCursor: null });
      if (url.includes("/cards/card-1/transactions")) return json({ items: [], nextCursor: null });
      return json({}, 404);
    });
    vi.stubGlobal("fetch", fetchMock);
    let tokenNumber = 0;

    const state = await loadFinanceState({ displayName: "Ana", getToken: async () => `token-${++tokenNumber}` });

    expect(state.accounts).toHaveLength(1);
    expect(state.transactions[0].amount).toBe(25);
    expect(calls.slice(0, 2)).toEqual(expect.arrayContaining([
      "https://api.example.test/api/v1/accounts",
      "https://api.example.test/api/v1/cards",
    ]));
    expect(tokenNumber).toBe(5);
  });

  it("rejeita toda a hidratação quando uma resposta parcial é inválida", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.test");
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.endsWith("/accounts")) return json({ items: [account], nextCursor: null });
      if (url.endsWith("/cards")) return json({ items: [], nextCursor: null });
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
});

import type { Account, CreditCard, FinanceState } from "@/domain/finance/types";
import { mapFinancePayload } from "./finance-mapper";
import { requestJson } from "./http-client";

type ApiOptions = {
  displayName: string;
  getToken: () => Promise<string>;
  signal?: AbortSignal;
};

const items = (value: unknown, label: string): unknown[] => {
  if (!value || typeof value !== "object" || !Array.isArray((value as { items?: unknown }).items)) throw new Error(`${label} retornou um envelope inválido.`);
  return (value as { items: unknown[] }).items;
};

async function mapLimit<T, R>(values: T[], limit: number, mapper: (value: T) => Promise<R>): Promise<R[]> {
  const result = new Array<R>(values.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, values.length) }, async () => {
    while (next < values.length) {
      const index = next++;
      result[index] = await mapper(values[index]);
    }
  });
  await Promise.all(workers);
  return result;
}

export async function loadFinanceState({ displayName, getToken, signal }: ApiOptions): Promise<FinanceState> {
  const request = (path: string) => requestJson(path, { getToken, signal });
  const [accountEnvelope, cardEnvelope] = await Promise.all([request("/api/v1/accounts"), request("/api/v1/cards")]);
  const accounts = items(accountEnvelope, "Contas");
  const cards = items(cardEnvelope, "Cartões");

  const accountChildren = await mapLimit(accounts, 4, async (value) => {
    const id = typeof value === "object" && value && typeof (value as { id?: unknown }).id === "string" ? (value as { id: string }).id : "";
    if (!id) throw new Error("Conta sem ID.");
    const [transactions, bills] = await Promise.all([
      request(`/api/v1/accounts/${encodeURIComponent(id)}/transactions`),
      request(`/api/v1/accounts/${encodeURIComponent(id)}/bills`),
    ]);
    return { transactions: items(transactions, "Lançamentos"), bills: items(bills, "Pendências") };
  });
  const purchaseGroups = await mapLimit(cards, 4, async (value) => {
    const id = typeof value === "object" && value && typeof (value as { id?: unknown }).id === "string" ? (value as { id: string }).id : "";
    if (!id) throw new Error("Cartão sem ID.");
    return items(await request(`/api/v1/cards/${encodeURIComponent(id)}/transactions`), "Compras");
  });

  return mapFinancePayload({
    accounts,
    cards,
    transactions: accountChildren.flatMap((group) => group.transactions),
    bills: accountChildren.flatMap((group) => group.bills),
    purchases: purchaseGroups.flat(),
  }, displayName);
}

export async function createRemoteAccount(input: Omit<Account, "id">, options: ApiOptions, idempotencyKey: string): Promise<Account> {
  const response = await requestJson("/api/v1/accounts", {
    method: "POST",
    getToken: options.getToken,
    signal: options.signal,
    idempotencyKey,
    body: { name: input.name, bank: input.bank, type: input.type, initialBalanceCents: Math.round(input.initialBalance * 100) },
  });
  return mapFinancePayload({ accounts: [response], transactions: [], bills: [], cards: [], purchases: [] }, options.displayName).accounts[0];
}

export async function createRemoteCard(input: Omit<CreditCard, "id">, options: ApiOptions, idempotencyKey: string): Promise<CreditCard> {
  const response = await requestJson("/api/v1/cards", {
    method: "POST",
    getToken: options.getToken,
    signal: options.signal,
    idempotencyKey,
    body: { name: input.name, limitCents: Math.round(input.limit * 100), closingDay: input.closingDay, dueDay: input.dueDay },
  });
  return mapFinancePayload({ accounts: [], transactions: [], bills: [], cards: [response], purchases: [] }, options.displayName).cards[0];
}

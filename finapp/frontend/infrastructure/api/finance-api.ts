import type { Account, Bill, CreditCard, FinanceState, Transaction } from "@/domain/finance/types";
import { mapAccount, mapBill, mapFinancePayload, mapTransaction } from "./finance-mapper";
import { requestJson } from "./http-client";

export type ApiOptions = {
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
  const accountEnvelope = await request("/api/v1/accounts");
  const accounts = items(accountEnvelope, "Contas");

  const accountChildren = await mapLimit(accounts, 4, async (value) => {
    const id = typeof value === "object" && value && typeof (value as { id?: unknown }).id === "string" ? (value as { id: string }).id : "";
    if (!id) throw new Error("Conta sem ID.");
    const [transactions, bills] = await Promise.all([
      request(`/api/v1/accounts/${encodeURIComponent(id)}/transactions`),
      request(`/api/v1/accounts/${encodeURIComponent(id)}/bills`),
    ]);
    return { transactions: items(transactions, "Lançamentos"), bills: items(bills, "Pendências") };
  });
  return mapFinancePayload({
    accounts,
    cards: [],
    transactions: accountChildren.flatMap((group) => group.transactions),
    bills: accountChildren.flatMap((group) => group.bills),
    purchases: [],
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

const accountBody = (input: Omit<Account, "id">) => ({ name: input.name, bank: input.bank || null, type: input.type, initialBalanceCents: Math.round(input.initialBalance * 100) });
const transactionBody = (input: Omit<Transaction, "id">) => ({ ...input, amountCents: Math.round(input.amount * 100), amount: undefined });
const billBody = (input: Omit<Bill, "id" | "status" | "paidOn" | "paymentTransactionId">) => ({ accountId: input.accountId, description: input.description, amountCents: Math.round(input.amount * 100), dueDate: input.dueDate });

export async function updateRemoteAccount(id: string, input: Omit<Account, "id">, options: ApiOptions): Promise<Account> {
  return mapAccount(await requestJson(`/api/v1/accounts/${encodeURIComponent(id)}`, { method: "PATCH", body: accountBody(input), getToken: options.getToken, signal: options.signal }));
}

export async function deleteRemoteAccount(id: string, options: ApiOptions): Promise<void> {
  await requestJson(`/api/v1/accounts/${encodeURIComponent(id)}`, { method: "DELETE", getToken: options.getToken, signal: options.signal });
}

export async function createRemoteTransaction(input: Omit<Transaction, "id">, options: ApiOptions, idempotencyKey: string): Promise<Transaction> {
  return mapTransaction(await requestJson("/api/v1/transactions", { method: "POST", body: transactionBody(input), idempotencyKey, getToken: options.getToken, signal: options.signal }));
}

export async function updateRemoteTransaction(id: string, input: Omit<Transaction, "id">, options: ApiOptions): Promise<Transaction> {
  return mapTransaction(await requestJson(`/api/v1/transactions/${encodeURIComponent(id)}`, { method: "PATCH", body: transactionBody(input), getToken: options.getToken, signal: options.signal }));
}

export async function deleteRemoteTransaction(id: string, options: ApiOptions): Promise<void> {
  await requestJson(`/api/v1/transactions/${encodeURIComponent(id)}`, { method: "DELETE", getToken: options.getToken, signal: options.signal });
}

export async function createRemoteBill(input: Omit<Bill, "id" | "status" | "paidOn" | "paymentTransactionId">, options: ApiOptions, idempotencyKey: string): Promise<Bill> {
  return mapBill(await requestJson("/api/v1/bills", { method: "POST", body: billBody(input), idempotencyKey, getToken: options.getToken, signal: options.signal }));
}

export async function updateRemoteBill(id: string, input: Omit<Bill, "id" | "status" | "paidOn" | "paymentTransactionId">, options: ApiOptions): Promise<Bill> {
  return mapBill(await requestJson(`/api/v1/bills/${encodeURIComponent(id)}`, { method: "PATCH", body: billBody(input), getToken: options.getToken, signal: options.signal }));
}

export async function deleteRemoteBill(id: string, options: ApiOptions): Promise<void> {
  await requestJson(`/api/v1/bills/${encodeURIComponent(id)}`, { method: "DELETE", getToken: options.getToken, signal: options.signal });
}

export async function payRemoteBill(id: string, input: { accountId: string; paidOn: string }, options: ApiOptions, idempotencyKey: string): Promise<{ bill: Bill; transaction: Transaction }> {
  const value = await requestJson(`/api/v1/bills/${encodeURIComponent(id)}/payments`, { method: "POST", body: input, idempotencyKey, getToken: options.getToken, signal: options.signal });
  if (!value || typeof value !== "object") throw new Error("Pagamento retornou uma resposta inválida.");
  const response = value as { bill?: unknown; transaction?: unknown };
  return { bill: mapBill(response.bill), transaction: mapTransaction(response.transaction) };
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

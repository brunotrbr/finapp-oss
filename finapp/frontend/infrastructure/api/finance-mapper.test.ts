import { describe, expect, it } from "vitest";
import { mapFinancePayload } from "./finance-mapper";

const payload = {
  accounts: [{ id: "account-1", name: "Principal", bank: "Banco", type: "Corrente", initialBalanceCents: 12345, balanceCents: 12345, currency: "BRL" }],
  transactions: [{ id: "transaction-1", accountId: "account-1", description: "Salário", amountCents: 5000, date: "2026-10-05", category: "Trabalho", note: "", currency: "BRL" }],
  bills: [{ id: "bill-1", accountId: "account-1", description: "Internet", amountCents: 9990, dueDate: "2026-10-20", currency: "BRL" }],
  cards: [{ id: "card-1", name: "Principal", limitCents: 450000, closingDay: 20, dueDay: 28, currency: "BRL" }],
  purchases: [{ id: "purchase-1", cardId: "card-1", description: "Notebook", amountCents: 90000, date: "2026-10-12", installments: 3, currency: "BRL" }],
};

describe("mapFinancePayload", () => {
  it("converte centavos e publica um estado completo", () => {
    const state = mapFinancePayload(payload, "Ana");
    expect(state.accounts[0].initialBalance).toBe(123.45);
    expect(state.transactions[0].amount).toBe(50);
    expect(state.cards[0].limit).toBe(4500);
    expect(state.displayName).toBe("Ana");
  });

  it("rejeita ids duplicados e referências órfãs", () => {
    expect(() => mapFinancePayload({ ...payload, accounts: [...payload.accounts, payload.accounts[0]] }, "Ana")).toThrow(/duplicado/i);
    expect(() => mapFinancePayload({ ...payload, transactions: [{ ...payload.transactions[0], accountId: "outra" }] }, "Ana")).toThrow(/conta/i);
  });
});

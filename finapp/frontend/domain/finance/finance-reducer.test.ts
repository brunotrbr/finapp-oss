import { describe, expect, it } from "vitest";
import {
  accountBalance,
  formatDate,
  formatMoney,
  pendingTotal,
  totalBalance,
} from "./calculations";
import { financeReducer } from "./finance-reducer";
import type { FinanceState } from "./types";
import {
  categoryError,
  dayError,
  positiveAmountError,
  requiredError,
} from "./validation";

const initialFinanceState: FinanceState = {
  displayName: "Usuário",
  accounts: [
    { id: "account-1", name: "Conta principal", bank: "Banco exemplo", type: "Corrente", initialBalance: 3200 },
    { id: "account-2", name: "Reserva", bank: "Banco digital", type: "Poupança", initialBalance: 1800 },
  ],
  transactions: [
    { id: "transaction-1", accountId: "account-1", description: "Salário", amount: 5200, date: "2026-10-05", category: "Trabalho", note: "" },
    { id: "transaction-2", accountId: "account-1", description: "Aluguel", amount: -1600, date: "2026-10-10", category: "Moradia", note: "" },
    { id: "transaction-3", accountId: "account-1", description: "Mercado", amount: -280, date: "2026-10-13", category: "Alimentação", note: "" },
    { id: "transaction-4", accountId: "account-2", description: "Transferência", amount: 600, date: "2026-10-15", category: "Transferência", note: "" },
  ],
  bills: [
    { id: "bill-1", description: "Internet", amount: 120, dueDate: "2026-10-22", accountId: "account-1" },
    { id: "bill-2", description: "Energia", amount: 210, dueDate: "2026-10-25", accountId: "account-1" },
  ],
  cards: [{ id: "card-1", name: "Cartão principal", limit: 4500, closingDay: 20, dueDay: 28 }],
  purchases: [{ id: "purchase-1", cardId: "card-1", description: "Notebook", amount: 900, date: "2026-10-12", installments: 3 }],
  categories: ["Alimentação", "Moradia", "Transporte", "Saúde", "Trabalho", "Lazer", "Transferência", "Outros"],
};

describe("cálculos financeiros", () => {
  it("deriva saldos, pendências e formata BRL sem depender do fuso", () => {
    expect(accountBalance(initialFinanceState.accounts[0], initialFinanceState.transactions)).toBe(6520);
    expect(totalBalance(initialFinanceState.accounts, initialFinanceState.transactions)).toBe(8920);
    expect(pendingTotal(initialFinanceState.bills, "2026-10")).toBe(330);
    expect(formatMoney(330)).toMatch(/R\$\s?330,00/);
    expect(formatDate("2026-10-05")).toBe("05/10/2026");
  });

  it("trata listas vazias e arredonda operações para centavos", () => {
    expect(totalBalance([], [])).toBe(0);
    expect(accountBalance({ id: "a", name: "A", bank: "", type: "Carteira", initialBalance: 0.1 }, [
      { id: "t", accountId: "a", description: "x", amount: 0.2, date: "2026-10-01", category: "Outros", note: "" },
    ])).toBe(0.3);
  });
});

describe("validação", () => {
  it("rejeita magnitudes inválidas, dias e campos vazios", () => {
    expect(positiveAmountError(0)).toBeTruthy();
    expect(positiveAmountError(Number.POSITIVE_INFINITY)).toBeTruthy();
    expect(positiveAmountError(10)).toBeNull();
    expect(dayError(0)).toBeTruthy();
    expect(dayError(31)).toBeNull();
    expect(dayError(2.5)).toBeTruthy();
    expect(requiredError("   ")).toBeTruthy();
  });

  it("normaliza espaços e impede categoria duplicada sem diferenciar caixa", () => {
    expect(categoryError("  alimentação  ", ["Alimentação"])).toBeTruthy();
    expect(categoryError(" Casa   nova ", ["Alimentação"])).toBeNull();
  });
});

describe("financeReducer", () => {
  it("bloqueia remoção de conta com lançamentos sem mutar o estado", () => {
    const state = initialFinanceState;
    const next = financeReducer(state, { type: "account/remove", id: "account-1" });
    expect(next).toBe(state);
  });

  it("bloqueia remoção de conta com pendências sem apagar dados vinculados", () => {
    const state = {
      ...initialFinanceState,
      transactions: initialFinanceState.transactions.filter(({ accountId }) => accountId !== "account-1"),
    };
    const next = financeReducer(state, { type: "account/remove", id: "account-1" });
    expect(next).toBe(state);
    expect(next.bills.filter(({ accountId }) => accountId === "account-1")).toHaveLength(2);
  });

  it("paga pendência atomicamente e uma única vez", () => {
    const paid = financeReducer(initialFinanceState, { type: "bill/pay", id: "bill-1", paidOn: "2026-10-18" });
    expect(paid.bills).toHaveLength(initialFinanceState.bills.length - 1);
    expect(paid.transactions).toHaveLength(initialFinanceState.transactions.length + 1);
    expect(paid.transactions.at(-1)?.amount).toBe(-120);
    expect(paid.transactions.at(-1)?.date).toBe("2026-10-18");
    expect(financeReducer(paid, { type: "bill/pay", id: "bill-1", paidOn: "2026-10-18" })).toBe(paid);
  });

  it("ignora referências inválidas e impede lançamento em conta inexistente", () => {
    const next = financeReducer(initialFinanceState, {
      type: "transaction/add",
      transaction: { id: "bad", accountId: "missing", description: "X", amount: 10, date: "2026-10-18", category: "Outros", note: "" },
    });
    expect(next).toBe(initialFinanceState);
  });

  it("não cria cartões ou compras com números fora das regras", () => {
    const invalidCard = financeReducer(initialFinanceState, { type: "card/add", card: { id: "card-x", name: "X", limit: 0, closingDay: 32, dueDay: 0 } });
    expect(invalidCard).toBe(initialFinanceState);
    const invalidPurchase = financeReducer(initialFinanceState, { type: "purchase/add", purchase: { id: "purchase-x", cardId: "card-1", description: "X", amount: Number.NaN, date: "2026-10-18", installments: 0 } });
    expect(invalidPurchase).toBe(initialFinanceState);
  });

  it("não produz novo estado ao editar uma entidade removida", () => {
    const next = financeReducer(initialFinanceState, { type: "transaction/edit", transaction: { id: "missing", accountId: "account-1", description: "X", amount: 10, date: "2026-10-18", category: "Outros", note: "" } });
    expect(next).toBe(initialFinanceState);
  });

  it("normaliza uma nova categoria e rejeita duplicata sem diferenciar caixa", () => {
    const added = financeReducer(initialFinanceState, { type: "category/add", name: "  Casa   nova " });
    expect(added.categories.at(-1)).toBe("Casa nova");
    expect(financeReducer(added, { type: "category/add", name: "casa NOVA" })).toBe(added);
  });
});

import type { FinanceState } from "@/domain/finance/types";

export const DEMO_DATE = "2026-10-18";
export const DEMO_MONTH = "2026-10";

export const initialFinanceState: FinanceState = {
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
    { id: "bill-1", description: "Internet", amount: 120, dueDate: "2026-10-22", accountId: "account-1", status: "open" },
    { id: "bill-2", description: "Energia", amount: 210, dueDate: "2026-10-25", accountId: "account-1", status: "open" },
  ],
  cards: [
    { id: "card-1", name: "Cartão principal", limit: 4500, closingDay: 20, dueDay: 28 },
  ],
  purchases: [
    { id: "purchase-1", cardId: "card-1", description: "Notebook", amount: 900, date: "2026-10-12", installments: 3 },
  ],
  invoicePayments: [],
  categories: ["Alimentação", "Moradia", "Transporte", "Saúde", "Trabalho", "Lazer", "Transferência", "Outros"],
};

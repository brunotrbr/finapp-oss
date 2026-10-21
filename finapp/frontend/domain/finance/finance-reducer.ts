import { normalizeSpaces } from "./validation";
import type { Account, Bill, CreditCard, FinanceState, Purchase, Transaction } from "./types";

export type FinanceAction =
  | { type: "account/add"; account: Account }
  | { type: "account/edit"; account: Account }
  | { type: "account/remove"; id: string }
  | { type: "transaction/add"; transaction: Transaction }
  | { type: "transaction/edit"; transaction: Transaction }
  | { type: "transaction/remove"; id: string }
  | { type: "bill/add"; bill: Bill }
  | { type: "bill/remove"; id: string }
  | { type: "bill/pay"; id: string; paidOn: string }
  | { type: "card/add"; card: CreditCard }
  | { type: "purchase/add"; purchase: Purchase }
  | { type: "purchase/remove"; id: string }
  | { type: "category/add"; name: string }
  | { type: "profile/name"; name: string };

const replaceById = <T extends { id: string }>(items: T[], item: T) =>
  items.some(({ id }) => id === item.id) ? items.map((current) => current.id === item.id ? item : current) : items;
const positive = (value: number) => Number.isFinite(value) && value > 0;
const validDay = (value: number) => Number.isInteger(value) && value >= 1 && value <= 31;
const present = (value: string) => normalizeSpaces(value).length > 0;

export function financeReducer(state: FinanceState, action: FinanceAction): FinanceState {
  switch (action.type) {
    case "account/add":
      return state.accounts.some(({ id }) => id === action.account.id) || !present(action.account.name) || !Number.isFinite(action.account.initialBalance) ? state : { ...state, accounts: [...state.accounts, action.account] };
    case "account/edit": {
      const accounts = replaceById(state.accounts, action.account);
      return accounts === state.accounts ? state : { ...state, accounts };
    }
    case "account/remove":
      if (!state.accounts.some(({ id }) => id === action.id) || state.transactions.some(({ accountId }) => accountId === action.id) || state.bills.some(({ accountId }) => accountId === action.id)) return state;
      return { ...state, accounts: state.accounts.filter(({ id }) => id !== action.id) };
    case "transaction/add":
      if (state.transactions.some(({ id }) => id === action.transaction.id) || !state.accounts.some(({ id }) => id === action.transaction.accountId) || !present(action.transaction.description) || !present(action.transaction.date) || !Number.isFinite(action.transaction.amount) || action.transaction.amount === 0) return state;
      return { ...state, transactions: [...state.transactions, action.transaction] };
    case "transaction/edit":
      if (!state.transactions.some(({ id }) => id === action.transaction.id) || !state.accounts.some(({ id }) => id === action.transaction.accountId) || !present(action.transaction.description) || !present(action.transaction.date) || !Number.isFinite(action.transaction.amount) || action.transaction.amount === 0) return state;
      return { ...state, transactions: replaceById(state.transactions, action.transaction) };
    case "transaction/remove":
      return state.transactions.some(({ id }) => id === action.id) ? { ...state, transactions: state.transactions.filter(({ id }) => id !== action.id) } : state;
    case "bill/add":
      if (state.bills.some(({ id }) => id === action.bill.id) || !state.accounts.some(({ id }) => id === action.bill.accountId) || !present(action.bill.description) || !present(action.bill.dueDate) || !positive(action.bill.amount)) return state;
      return { ...state, bills: [...state.bills, action.bill] };
    case "bill/remove":
      return state.bills.some(({ id }) => id === action.id) ? { ...state, bills: state.bills.filter(({ id }) => id !== action.id) } : state;
    case "bill/pay": {
      const bill = state.bills.find(({ id }) => id === action.id);
      if (!bill || !state.accounts.some(({ id }) => id === bill.accountId)) return state;
      const transaction: Transaction = {
        id: `payment-${bill.id}`,
        accountId: bill.accountId,
        description: bill.description,
        amount: -bill.amount,
        date: action.paidOn,
        category: "Outros",
        note: "Pagamento de pendência",
      };
      return { ...state, bills: state.bills.filter(({ id }) => id !== bill.id), transactions: [...state.transactions, transaction] };
    }
    case "card/add":
      if (state.cards.some(({ id }) => id === action.card.id) || !present(action.card.name) || !positive(action.card.limit) || !validDay(action.card.closingDay) || !validDay(action.card.dueDay)) return state;
      return { ...state, cards: [...state.cards, action.card] };
    case "purchase/add":
      return state.cards.some(({ id }) => id === action.purchase.cardId) && !state.purchases.some(({ id }) => id === action.purchase.id) && present(action.purchase.description) && present(action.purchase.date) && positive(action.purchase.amount) && Number.isInteger(action.purchase.installments) && action.purchase.installments > 0 ? { ...state, purchases: [...state.purchases, action.purchase] } : state;
    case "purchase/remove":
      return state.purchases.some(({ id }) => id === action.id) ? { ...state, purchases: state.purchases.filter(({ id }) => id !== action.id) } : state;
    case "category/add": {
      const name = normalizeSpaces(action.name);
      if (!name || state.categories.some((category) => category.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR"))) return state;
      return { ...state, categories: [...state.categories, name] };
    }
    case "profile/name": {
      const displayName = normalizeSpaces(action.name);
      return displayName ? { ...state, displayName } : state;
    }
  }
}

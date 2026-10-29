import { normalizeSpaces } from "./validation";
import { invoiceForCycle } from "./calculations";
import type { Account, Bill, CreditCard, FinanceState, Purchase, Transaction } from "./types";

export type FinanceAction =
  | { type: "state/hydrate"; state: FinanceState }
  | { type: "state/clear"; displayName?: string }
  | { type: "account/add"; account: Account }
  | { type: "account/edit"; account: Account }
  | { type: "account/remove"; id: string }
  | { type: "account/remove-and-reclassify"; id: string; destinationId: string }
  | { type: "account/deletion-result-consume" }
  | { type: "transaction/add"; transaction: Transaction }
  | { type: "transaction/edit"; transaction: Transaction }
  | { type: "transaction/remove"; id: string }
  | { type: "bill/add"; bill: Bill }
  | { type: "bill/remove"; id: string }
  | { type: "bill/pay"; id: string; paidOn: string }
  | { type: "card/add"; card: CreditCard }
  | { type: "purchase/add"; purchase: Purchase }
  | { type: "purchase/remove"; id: string }
  | { type: "invoice/pay"; cardId: string; cycle: string; accountId: string; paidOn: string }
  | { type: "category/add"; name: string }
  | { type: "category/edit"; currentName: string; name: string }
  | { type: "category/remove-and-reclassify"; name: string; destinationName: string }
  | { type: "profile/name"; name: string };

const replaceById = <T extends { id: string }>(items: T[], item: T) =>
  items.some(({ id }) => id === item.id) ? items.map((current) => current.id === item.id ? item : current) : items;
const positive = (value: number) => Number.isFinite(value) && value > 0;
const validDay = (value: number) => Number.isInteger(value) && value >= 1 && value <= 31;
const present = (value: string) => normalizeSpaces(value).length > 0;
export const SYSTEM_PAYMENT_CATEGORY = "Outros";
const hasCategory = (state: FinanceState, name: string) => state.categories.includes(name);

type InvoicePaymentInput = { cardId: string; cycle: string; accountId: string; paidOn: string };

export function invoicePaymentError(state: FinanceState, input: InvoicePaymentInput) {
  const card = state.cards.find(({ id }) => id === input.cardId);
  const paymentId = `invoice-payment-${input.cardId}-${input.cycle}`;
  if (!card || !state.accounts.some(({ id }) => id === input.accountId) || !hasCategory(state, SYSTEM_PAYMENT_CATEGORY)) return "Não foi possível validar cartão, conta e categoria de pagamento.";
  if (!/^\d{4}-\d{2}$/.test(input.cycle) || !present(input.paidOn)) return "Ciclo ou data de pagamento inválidos.";
  if (state.invoicePayments.some(({ id }) => id === paymentId) || state.transactions.some(({ id }) => id === paymentId)) return "Esta fatura já foi paga.";
  if (!positive(invoiceForCycle(card, state.purchases, input.cycle).total)) return "Não há valor a pagar neste ciclo.";
  return null;
}

export function financeReducer(state: FinanceState, action: FinanceAction): FinanceState {
  switch (action.type) {
    case "state/hydrate":
      return action.state;
    case "state/clear":
      return {
        accounts: [], transactions: [], bills: [], cards: [], purchases: [],
        invoicePayments: [], categories: [], displayName: action.displayName || "Usuário",
      };
    case "account/add":
      return state.accounts.some(({ id }) => id === action.account.id) || !present(action.account.name) || !Number.isFinite(action.account.initialBalance) ? state : { ...state, accounts: [...state.accounts, action.account] };
    case "account/edit": {
      const accounts = replaceById(state.accounts, action.account);
      return accounts === state.accounts ? state : { ...state, accounts };
    }
    case "account/remove": {
      const account = state.accounts.find(({ id }) => id === action.id);
      if (!account || state.transactions.some(({ accountId }) => accountId === action.id) || state.bills.some(({ accountId }) => accountId === action.id) || state.invoicePayments.some(({ accountId }) => accountId === action.id)) return state;
      return { ...state, accounts: state.accounts.filter(({ id }) => id !== action.id), accountDeletionResult: { accountName: account.name, reclassified: false } };
    }
    case "account/remove-and-reclassify": {
      const account = state.accounts.find(({ id }) => id === action.id);
      const destination = state.accounts.find(({ id }) => id === action.destinationId);
      if (action.id === action.destinationId || !account || !destination) return state;
      const transactionCount = state.transactions.filter(({ accountId }) => accountId === action.id).length;
      const billCount = state.bills.filter(({ accountId }) => accountId === action.id).length;
      return {
        ...state,
        accounts: state.accounts
          .filter(({ id }) => id !== action.id)
          .map((current) => current.id === action.destinationId
            ? { ...current, initialBalance: current.initialBalance + account.initialBalance }
            : current),
        transactions: state.transactions.map((transaction) => transaction.accountId === action.id ? { ...transaction, accountId: action.destinationId } : transaction),
        bills: state.bills.map((bill) => bill.accountId === action.id ? { ...bill, accountId: action.destinationId } : bill),
        invoicePayments: state.invoicePayments.map((payment) => payment.accountId === action.id ? { ...payment, accountId: action.destinationId } : payment),
        accountDeletionResult: {
          accountName: account.name,
          destinationName: destination.name,
          reclassified: true,
          transactionCount,
          billCount,
          transferredInitialBalance: account.initialBalance,
        },
      };
    }
    case "account/deletion-result-consume":
      if (!state.accountDeletionResult) return state;
      return { ...state, accountDeletionResult: undefined };
    case "transaction/add":
      if (state.transactions.some(({ id }) => id === action.transaction.id) || !state.accounts.some(({ id }) => id === action.transaction.accountId) || !hasCategory(state, action.transaction.category) || !present(action.transaction.description) || !present(action.transaction.date) || !Number.isFinite(action.transaction.amount) || action.transaction.amount === 0) return state;
      return { ...state, transactions: [...state.transactions, action.transaction] };
    case "transaction/edit":
      if (!state.transactions.some(({ id }) => id === action.transaction.id) || !state.accounts.some(({ id }) => id === action.transaction.accountId) || !hasCategory(state, action.transaction.category) || !present(action.transaction.description) || !present(action.transaction.date) || !Number.isFinite(action.transaction.amount) || action.transaction.amount === 0) return state;
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
      if (!bill || !state.accounts.some(({ id }) => id === bill.accountId) || !hasCategory(state, SYSTEM_PAYMENT_CATEGORY)) return state;
      const transaction: Transaction = {
        id: `payment-${bill.id}`,
        accountId: bill.accountId,
        description: bill.description,
        amount: -bill.amount,
        date: action.paidOn,
        category: SYSTEM_PAYMENT_CATEGORY,
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
    case "invoice/pay": {
      const card = state.cards.find(({ id }) => id === action.cardId);
      const account = state.accounts.find(({ id }) => id === action.accountId);
      const paymentId = `invoice-payment-${action.cardId}-${action.cycle}`;
      if (invoicePaymentError(state, action) || !card || !account) return state;
      const invoice = invoiceForCycle(card, state.purchases, action.cycle);
      return {
        ...state,
        invoicePayments: [...state.invoicePayments, { id: paymentId, cardId: card.id, cycle: action.cycle, accountId: account.id, amount: invoice.total, paidOn: action.paidOn }],
        transactions: [...state.transactions, {
          id: paymentId,
          accountId: account.id,
          description: `Pagamento da fatura ${card.name}`,
          amount: -invoice.total,
          date: action.paidOn,
          category: SYSTEM_PAYMENT_CATEGORY,
          note: `Fatura ${action.cycle}`,
        }],
      };
    }
    case "category/add": {
      const name = normalizeSpaces(action.name);
      if (!name || state.categories.some((category) => category.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR"))) return state;
      return { ...state, categories: [...state.categories, name] };
    }
    case "category/edit": {
      const currentName = state.categories.find((category) => category.toLocaleLowerCase("pt-BR") === action.currentName.toLocaleLowerCase("pt-BR"));
      const name = normalizeSpaces(action.name);
      if (!currentName || currentName === SYSTEM_PAYMENT_CATEGORY || !name || state.categories.some((category) => category !== currentName && category.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR"))) return state;
      return {
        ...state,
        categories: state.categories.map((category) => category === currentName ? name : category),
        transactions: state.transactions.map((transaction) => transaction.category === currentName ? { ...transaction, category: name } : transaction),
      };
    }
    case "category/remove-and-reclassify": {
      const name = state.categories.find((category) => category.toLocaleLowerCase("pt-BR") === action.name.toLocaleLowerCase("pt-BR"));
      const destinationName = state.categories.find((category) => category.toLocaleLowerCase("pt-BR") === action.destinationName.toLocaleLowerCase("pt-BR"));
      if (!name || name === SYSTEM_PAYMENT_CATEGORY || !destinationName || name === destinationName) return state;
      return {
        ...state,
        categories: state.categories.filter((category) => category !== name),
        transactions: state.transactions.map((transaction) => transaction.category === name ? { ...transaction, category: destinationName } : transaction),
      };
    }
    case "profile/name": {
      const displayName = normalizeSpaces(action.name);
      return displayName ? { ...state, displayName } : state;
    }
  }
}

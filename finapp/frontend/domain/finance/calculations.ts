import type { Account, Bill, Transaction } from "./types";

const cents = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function accountBalance(account: Account, transactions: Transaction[]) {
  return cents(account.initialBalance + transactions
    .filter((transaction) => transaction.accountId === account.id)
    .reduce((sum, transaction) => sum + transaction.amount, 0));
}

export function totalBalance(accounts: Account[], transactions: Transaction[]) {
  return cents(accounts.reduce((sum, account) => sum + accountBalance(account, transactions), 0));
}

export function pendingTotal(bills: Bill[], month: string) {
  return cents(bills
    .filter((bill) => bill.dueDate.startsWith(month))
    .reduce((sum, bill) => sum + bill.amount, 0));
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

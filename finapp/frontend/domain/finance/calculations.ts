import type { Account, Bill, CreditCard, Purchase, Transaction } from "./types";

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
    .filter((bill) => bill.status !== "paid" && bill.dueDate.slice(0, 7) <= month)
    .reduce((sum, bill) => sum + bill.amount, 0));
}

export function pendingBreakdown(bills: Bill[], month: string) {
  const open = bills.filter((bill) => bill.status !== "paid");
  return {
    overdue: cents(open.filter((bill) => bill.dueDate.slice(0, 7) < month).reduce((sum, bill) => sum + bill.amount, 0)),
    dueThisMonth: cents(open.filter((bill) => bill.dueDate.startsWith(month)).reduce((sum, bill) => sum + bill.amount, 0)),
    paid: bills.filter((bill) => bill.status === "paid"),
  };
}

const parseMonth = (month: string) => {
  const [year, monthNumber] = month.split("-").map(Number);
  return { year, monthIndex: monthNumber - 1 };
};

const monthKey = (year: number, monthIndex: number) => {
  const date = new Date(Date.UTC(year, monthIndex, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
};

const shiftMonth = (month: string, delta: number) => {
  const { year, monthIndex } = parseMonth(month);
  return monthKey(year, monthIndex + delta);
};

const cycleDate = (cycle: string, day: number) => {
  const { year, monthIndex } = parseMonth(cycle);
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  return `${cycle}-${String(Math.min(day, lastDay)).padStart(2, "0")}`;
};

const monthDistance = (from: string, to: string) => {
  const start = parseMonth(from);
  const end = parseMonth(to);
  return (end.year - start.year) * 12 + end.monthIndex - start.monthIndex;
};

export type InvoiceItem = {
  purchaseId: string;
  description: string;
  date: string;
  installment: number;
  installments: number;
  amount: number;
};

export function invoiceForCycle(card: CreditCard, purchases: Purchase[], cycle: string) {
  const items = purchases.flatMap<InvoiceItem>((purchase) => {
    if (purchase.cardId !== card.id) return [];
    const purchaseMonth = purchase.date.slice(0, 7);
    const purchaseDay = Number(purchase.date.slice(8, 10));
    const firstCycle = purchaseDay <= card.closingDay ? purchaseMonth : shiftMonth(purchaseMonth, 1);
    const installmentIndex = monthDistance(firstCycle, cycle);
    if (installmentIndex < 0 || installmentIndex >= purchase.installments) return [];
    const regularAmount = cents(purchase.amount / purchase.installments);
    const amount = installmentIndex === purchase.installments - 1
      ? cents(purchase.amount - regularAmount * (purchase.installments - 1))
      : regularAmount;
    return [{
      purchaseId: purchase.id,
      description: purchase.description,
      date: purchase.date,
      installment: installmentIndex + 1,
      installments: purchase.installments,
      amount,
    }];
  });
  const dueCycle = card.dueDay > card.closingDay ? cycle : shiftMonth(cycle, 1);
  return {
    cycle,
    closingDate: cycleDate(cycle, card.closingDay),
    dueDate: cycleDate(dueCycle, card.dueDay),
    items,
    total: cents(items.reduce((total, item) => total + item.amount, 0)),
  };
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

export type Account = {
  id: string;
  name: string;
  bank: string;
  type: "Corrente" | "Poupança" | "Carteira";
  initialBalance: number;
};

export type Transaction = {
  id: string;
  accountId: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  note: string;
};

export type Bill = {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  accountId: string;
  status: "open" | "paid";
  paidOn?: string;
  paymentTransactionId?: string;
};

export type CreditCard = {
  id: string;
  name: string;
  limit: number;
  closingDay: number;
  dueDay: number;
};

export type Purchase = {
  id: string;
  cardId: string;
  description: string;
  amount: number;
  date: string;
  installments: number;
};

export type InvoicePayment = {
  id: string;
  cardId: string;
  cycle: string;
  accountId: string;
  amount: number;
  paidOn: string;
};

export type AccountDeletionResult = {
  accountName: string;
  reclassified: boolean;
  destinationName?: string;
  transactionCount?: number;
  billCount?: number;
  transferredInitialBalance?: number;
};

export type FinanceState = {
  accounts: Account[];
  transactions: Transaction[];
  bills: Bill[];
  cards: CreditCard[];
  purchases: Purchase[];
  invoicePayments: InvoicePayment[];
  categories: string[];
  displayName: string;
  accountDeletionResult?: AccountDeletionResult;
};

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

export type FinanceState = {
  accounts: Account[];
  transactions: Transaction[];
  bills: Bill[];
  cards: CreditCard[];
  purchases: Purchase[];
  categories: string[];
  displayName: string;
};

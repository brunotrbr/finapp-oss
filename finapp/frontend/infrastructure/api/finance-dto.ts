export type ListDto<T> = { items: T[]; nextCursor: string | null };

export type AccountDto = {
  id: string;
  name: string;
  bank: string;
  type: string;
  initialBalanceCents: number;
  balanceCents: number;
  currency: string;
};

export type TransactionDto = {
  id: string;
  accountId: string;
  description: string;
  amountCents: number;
  date: string;
  category: string;
  note: string;
  currency: string;
};

export type BillDto = {
  id: string;
  accountId: string;
  description: string;
  amountCents: number;
  dueDate: string;
  currency: string;
};

export type CardDto = {
  id: string;
  name: string;
  limitCents: number;
  closingDay: number;
  dueDay: number;
  currency: string;
};

export type PurchaseDto = {
  id: string;
  cardId: string;
  description: string;
  amountCents: number;
  date: string;
  installments: number;
  currency: string;
};

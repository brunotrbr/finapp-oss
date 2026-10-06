// Dados de demonstração da tela principal.
// TODO: substituir pelos dados da API autenticada do Finapp quando disponível.
// Quando o backend for conectado, estas estruturas
// passam a vir das consultas — os tipos já estão prontos para isso.

export type PendingBill = {
  id: string;
  name: string;
  category: string;
  amount: number;
  /** Texto do vencimento, ex.: "Venceu há 3 dias" */
  dueLabel: string;
};

export type UpcomingBill = {
  id: string;
  name: string;
  amount: number;
  /** Quantos dias faltam para o vencimento */
  daysAhead: number;
};

export type Transaction = {
  id: string;
  name: string;
  category: string;
  amount: number; // positivo = crédito (entrada), negativo = débito
  dateLabel: string;
  timeLabel?: string;
};

export type FinanceAccount = {
  id: string;
  name: string;
  totalBalance: number;
  monthChange: number;
  activeBillsCount: number;
  monthBillsTotal: number;
  pendingBills: PendingBill[];
  upcomingBills: UpcomingBill[];
  recentTransactions: Transaction[];
};

export const pendingBills: PendingBill[] = [
  {
    id: "b1",
    name: "Aluguel — Apto 42",
    category: "Moradia",
    amount: 1800,
    dueLabel: "Venceu há 3 dias",
  },
  {
    id: "b2",
    name: "Cartão Nubank",
    category: "Fatura",
    amount: 1240,
    dueLabel: "Vence hoje · 18h",
  },
  {
    id: "b3",
    name: "Luz — Enel SP",
    category: "Serviços",
    amount: 189.4,
    dueLabel: "Venceu há 1 dia",
  },
];

export const upcomingBills: UpcomingBill[] = [
  { id: "u1", name: "Internet — Vivo Fibra", amount: 119.9, daysAhead: 2 },
  { id: "u2", name: "Academia — SmartFit", amount: 99, daysAhead: 5 },
  { id: "u3", name: "Streaming — Netflix", amount: 55.9, daysAhead: 8 },
  { id: "u4", name: "Seguro — Porto", amount: 240, daysAhead: 12 },
];

export const recentTransactions: Transaction[] = [
  {
    id: "t1",
    name: "Mercado — Pão de Açúcar",
    category: "Alimentação",
    amount: -214.8,
    dateLabel: "Hoje",
    timeLabel: "11h24",
  },
  {
    id: "t2",
    name: "Salário — SaaS Ltda",
    category: "Renda",
    amount: 8400,
    dateLabel: "Hoje",
    timeLabel: "09h00",
  },
  {
    id: "t3",
    name: "Padaria Pão Quente",
    category: "Alimentação",
    amount: -28.9,
    dateLabel: "Ontem",
    timeLabel: "18h41",
  },
];

export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// Placeholder: contas de demonstração. A página deve receber apenas as contas
// pertencentes ao usuário autenticado quando a API estiver disponível.
export const demoFinanceAccounts: FinanceAccount[] = [
  {
    id: "conta-principal",
    name: "Conta principal",
    totalBalance: 18380.55,
    monthChange: 1540,
    activeBillsCount: 4,
    monthBillsTotal: 3800,
    pendingBills: [pendingBills[0], pendingBills[2]],
    upcomingBills: [upcomingBills[0], upcomingBills[3]],
    recentTransactions: [recentTransactions[0], recentTransactions[1]],
  },
  {
    id: "conta-nubank",
    name: "Nubank",
    totalBalance: 6000,
    monthChange: -300,
    activeBillsCount: 2,
    monthBillsTotal: 2020,
    pendingBills: [pendingBills[1]],
    upcomingBills: [upcomingBills[1], upcomingBills[2]],
    recentTransactions: [recentTransactions[2]],
  },
];

// Somas em centavos para evitar erros de ponto flutuante nos valores monetários.
function sumMoney(values: number[]): number {
  return values.reduce((total, value) => total + Math.round(value * 100), 0) / 100;
}

export function getAccountOverview(accounts: FinanceAccount[], accountId: string | null) {
  const selected = accountId === null
    ? accounts
    : accounts.filter((account) => account.id === accountId);

  const totalBalance = sumMoney(selected.map((account) => account.totalBalance));
  const monthBillsTotal = sumMoney(selected.map((account) => account.monthBillsTotal));

  return {
    name: accountId === null ? "todas contas" : selected[0]?.name ?? "Conta indisponível",
    totalBalance,
    monthChange: sumMoney(selected.map((account) => account.monthChange)),
    activeBillsCount: selected.reduce((total, account) => total + account.activeBillsCount, 0),
    monthBillsTotal,
    freeBalance: sumMoney([totalBalance, -monthBillsTotal]),
    pendingBills: selected.flatMap((account) =>
      account.pendingBills.map((bill) => ({ ...bill, accountId: account.id }))),
    upcomingBills: selected.flatMap((account) =>
      account.upcomingBills.map((bill) => ({ ...bill, accountId: account.id })))
      .sort((a, b) => a.daysAhead - b.daysAhead),
    recentTransactions: selected.flatMap((account) =>
      account.recentTransactions.map((transaction) => ({ ...transaction, accountId: account.id }))),
  };
}

// Identificadores de lançamentos podem se repetir em contas diferentes.
export function accountRecordKey(accountId: string, recordId: string): string {
  return JSON.stringify([accountId, recordId]);
}

export function formatHeaderDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

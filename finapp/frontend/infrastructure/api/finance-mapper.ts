import { FIXED_CATEGORIES } from "@/domain/finance/categories";
import type { Account, Bill, CreditCard, FinanceState, Purchase, Transaction } from "@/domain/finance/types";

type RecordValue = Record<string, unknown>;

const object = (value: unknown, label: string): RecordValue => {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} inválido.`);
  return value as RecordValue;
};

const array = (value: unknown, label: string): unknown[] => {
  if (!Array.isArray(value)) throw new Error(`${label} deve ser uma lista.`);
  return value;
};

const text = (value: unknown, label: string, allowEmpty = false): string => {
  if (typeof value !== "string" || (!allowEmpty && !value.trim())) throw new Error(`${label} inválido.`);
  return value;
};

const integer = (value: unknown, label: string): number => {
  if (typeof value !== "number" || !Number.isSafeInteger(value)) throw new Error(`${label} deve ser um inteiro seguro.`);
  return value;
};

const cents = (value: unknown, label: string): number => integer(value, label) / 100;

const day = (value: unknown, label: string): number => {
  const parsed = integer(value, label);
  if (parsed < 1 || parsed > 31) throw new Error(`${label} deve estar entre 1 e 31.`);
  return parsed;
};

const isoDate = (value: unknown, label: string): string => {
  const parsed = text(value, label);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(parsed)) throw new Error(`${label} deve usar YYYY-MM-DD.`);
  const [year, month, date] = parsed.split("-").map(Number);
  const candidate = new Date(Date.UTC(year, month - 1, date));
  if (candidate.getUTCFullYear() !== year || candidate.getUTCMonth() !== month - 1 || candidate.getUTCDate() !== date) throw new Error(`${label} inválida.`);
  return parsed;
};

const currency = (value: unknown) => {
  if (value !== "BRL") throw new Error("Moeda não suportada; esperado BRL.");
};

const unique = <T extends { id: string }>(items: T[], label: string) => {
  const ids = new Set<string>();
  for (const item of items) {
    if (ids.has(item.id)) throw new Error(`ID duplicado em ${label}: ${item.id}.`);
    ids.add(item.id);
  }
  return ids;
};

export function mapAccount(value: unknown): Account {
  const dto = object(value, "Conta");
  currency(dto.currency);
  const type = text(dto.type, "Tipo da conta");
  if (type !== "Corrente" && type !== "Poupança" && type !== "Carteira") throw new Error("Tipo da conta inválido.");
  const bank = dto.bank == null ? "" : text(dto.bank, "Banco", true);
  return { id: text(dto.id, "ID da conta"), name: text(dto.name, "Nome da conta"), bank, type, initialBalance: cents(dto.initialBalanceCents, "Saldo inicial") };
}

export function mapTransaction(value: unknown): Transaction {
  const dto = object(value, "Lançamento");
  currency(dto.currency);
  const amount = cents(dto.amountCents, "Valor do lançamento");
  if (amount === 0) throw new Error("Valor do lançamento não pode ser zero.");
  return { id: text(dto.id, "ID do lançamento"), accountId: text(dto.accountId, "Conta do lançamento"), description: text(dto.description, "Descrição do lançamento"), amount, date: isoDate(dto.date, "Data do lançamento"), category: text(dto.category, "Categoria"), note: text(dto.note, "Observação", true) };
}

export function mapBill(value: unknown): Bill {
  const dto = object(value, "Pendência");
  currency(dto.currency);
  const amount = cents(dto.amountCents, "Valor da pendência");
  if (amount <= 0) throw new Error("Valor da pendência deve ser positivo.");
  const status = dto.status === undefined ? "open" : text(dto.status, "Status da pendência");
  if (status !== "open" && status !== "paid") throw new Error("Status da pendência inválido.");
  const paidOn = dto.paidOn == null ? undefined : isoDate(dto.paidOn, "Data de pagamento");
  const paymentTransactionId = dto.paymentTransactionId == null ? undefined : text(dto.paymentTransactionId, "Lançamento de pagamento");
  if (status === "paid" && (!paidOn || !paymentTransactionId)) throw new Error("Pendência paga sem dados de pagamento.");
  return { id: text(dto.id, "ID da pendência"), accountId: text(dto.accountId, "Conta da pendência"), description: text(dto.description, "Descrição da pendência"), amount, dueDate: isoDate(dto.dueDate, "Vencimento da pendência"), status, paidOn, paymentTransactionId };
}

export function mapCard(value: unknown): CreditCard {
  const dto = object(value, "Cartão");
  currency(dto.currency);
  const limit = cents(dto.limitCents, "Limite do cartão");
  if (limit <= 0) throw new Error("Limite do cartão deve ser positivo.");
  return { id: text(dto.id, "ID do cartão"), name: text(dto.name, "Nome do cartão"), limit, closingDay: day(dto.closingDay, "Dia de fechamento"), dueDay: day(dto.dueDay, "Dia de vencimento") };
}

function mapPurchase(value: unknown): Purchase {
  const dto = object(value, "Compra");
  currency(dto.currency);
  const amount = cents(dto.amountCents, "Valor da compra");
  const installments = integer(dto.installments, "Parcelas");
  if (amount <= 0 || installments <= 0) throw new Error("Valor e parcelas da compra devem ser positivos.");
  return { id: text(dto.id, "ID da compra"), cardId: text(dto.cardId, "Cartão da compra"), description: text(dto.description, "Descrição da compra"), amount, date: isoDate(dto.date, "Data da compra"), installments };
}

export function mapFinancePayload(payload: unknown, displayName: string): FinanceState {
  const dto = object(payload, "Resposta financeira");
  const accounts = array(dto.accounts, "Contas").map(mapAccount);
  const transactions = array(dto.transactions, "Lançamentos").map(mapTransaction);
  const bills = array(dto.bills, "Pendências").map(mapBill);
  const cards = array(dto.cards, "Cartões").map(mapCard);
  const purchases = array(dto.purchases, "Compras").map(mapPurchase);
  const accountIds = unique(accounts, "contas");
  const cardIds = unique(cards, "cartões");
  unique(transactions, "lançamentos");
  unique(bills, "pendências");
  unique(purchases, "compras");

  if (transactions.some((item) => !accountIds.has(item.accountId))) throw new Error("Lançamento referencia uma conta inexistente.");
  if (bills.some((item) => !accountIds.has(item.accountId))) throw new Error("Pendência referencia uma conta inexistente.");
  if (purchases.some((item) => !cardIds.has(item.cardId))) throw new Error("Compra referencia um cartão inexistente.");

  const categories = [...FIXED_CATEGORIES];
  return { accounts, transactions, bills, cards, purchases, invoicePayments: [], categories, displayName: displayName.trim() || "Usuário" };
}

"use client";

import { createContext, useCallback, useContext, useEffect, useReducer, useRef, useState } from "react";
import { FIXED_CATEGORIES } from "@/domain/finance/categories";
import { financeReducer, type FinanceAction } from "@/domain/finance/finance-reducer";
import type { Account, Bill, CreditCard, FinanceState, Transaction } from "@/domain/finance/types";
import { useAuth } from "@/features/auth/auth-context";
import {
  createRemoteAccount, createRemoteBill, createRemoteCard, createRemoteTransaction,
  deleteRemoteAccount, deleteRemoteBill, deleteRemoteTransaction, loadFinanceState,
  payRemoteBill, updateRemoteAccount, updateRemoteBill, updateRemoteTransaction,
} from "@/infrastructure/api/finance-api";
import { getFinanceDataSource } from "@/infrastructure/api/config";
import { FinanceApiError } from "@/infrastructure/api/http-client";
import { initialFinanceState } from "./demo-state";

type FinanceStatus = "idle" | "loading" | "ready" | "empty" | "error";
type TransactionInput = Omit<Transaction, "id">;
type BillInput = Omit<Bill, "id" | "status" | "paidOn" | "paymentTransactionId">;

type FinanceContextValue = {
  state: FinanceState;
  dispatch: React.Dispatch<FinanceAction>;
  status: FinanceStatus;
  error: string | null;
  errorStatus: number | null;
  remote: boolean;
  retry: () => void;
  createAccount: (input: Omit<Account, "id">, key?: string) => Promise<Account>;
  updateAccount: (id: string, input: Omit<Account, "id">) => Promise<Account>;
  deleteAccount: (id: string) => Promise<void>;
  saveTransaction: (input: TransactionInput, id?: string, key?: string) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  saveBill: (input: BillInput, id?: string, key?: string) => Promise<Bill>;
  deleteBill: (id: string) => Promise<void>;
  payBill: (id: string, accountId: string, paidOn: string, key?: string) => Promise<void>;
  createCard: (input: Omit<CreditCard, "id">, key?: string) => Promise<CreditCard>;
};

const FinanceContext = createContext<FinanceContextValue | null>(null);

const emptyState = (displayName?: string | null): FinanceState => ({
  accounts: [], transactions: [], bills: [], cards: [], purchases: [], invoicePayments: [],
  categories: [...FIXED_CATEGORIES], displayName: displayName || "Usuário",
});

export function FinanceProvider({ children, initialName, initialState }: { children: React.ReactNode; initialName?: string | null; initialState?: FinanceState }) {
  const controlledDemo = process.env.NODE_ENV === "test" || getFinanceDataSource() === "demo";
  const demoState = initialState || (controlledDemo ? initialFinanceState : undefined);
  const remote = !demoState;
  const auth = useAuth();
  const [state, dispatch] = useReducer(financeReducer, demoState ? { ...demoState, displayName: initialName || demoState.displayName } : emptyState(initialName));
  const [status, setStatus] = useState<FinanceStatus>(demoState ? "ready" : "idle");
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [retryVersion, setRetryVersion] = useState(0);
  const generation = useRef(0);
  const retry = useCallback(() => setRetryVersion((value) => value + 1), []);

  useEffect(() => {
    if (!remote || auth.loading) return;
    const currentGeneration = ++generation.current;
    const controller = new AbortController();
    if (!auth.user) {
      queueMicrotask(() => {
        if (controller.signal.aborted) return;
        dispatch({ type: "state/clear", displayName: initialName || undefined });
        setStatus("idle"); setError(null); setErrorStatus(null);
      });
      return () => controller.abort();
    }
    const displayName = auth.user.displayName || initialName || "Usuário";
    queueMicrotask(() => {
      if (controller.signal.aborted) return;
      dispatch({ type: "state/clear", displayName });
      setStatus("loading"); setError(null); setErrorStatus(null);
      loadFinanceState({ displayName, getToken: () => auth.user!.getIdToken(), signal: controller.signal }).then((nextState) => {
        if (controller.signal.aborted || generation.current !== currentGeneration) return;
        dispatch({ type: "state/hydrate", state: nextState });
        setStatus(nextState.accounts.length ? "ready" : "empty");
      }).catch((reason: unknown) => {
        if (controller.signal.aborted || generation.current !== currentGeneration) return;
        setStatus("error");
        setError(reason instanceof Error ? reason.message : "Não foi possível carregar os dados financeiros.");
        setErrorStatus(reason instanceof FinanceApiError ? reason.status : null);
      });
    });
    return () => controller.abort();
  }, [auth.loading, auth.user, initialName, remote, retryVersion]);

  const apiOptions = () => {
    if (!auth.user) throw new FinanceApiError(401, "missing_user", false);
    return { displayName: state.displayName, getToken: () => auth.user!.getIdToken() };
  };

  const createAccount = async (input: Omit<Account, "id">, key = crypto.randomUUID()) => {
    const account = remote ? await createRemoteAccount(input, apiOptions(), key) : { ...input, id: crypto.randomUUID() };
    dispatch({ type: "account/add", account }); return account;
  };
  const updateAccount = async (id: string, input: Omit<Account, "id">) => {
    const account = remote ? await updateRemoteAccount(id, input, apiOptions()) : { ...input, id };
    dispatch({ type: "account/edit", account }); return account;
  };
  const deleteAccount = async (id: string) => {
    if (!remote && (state.transactions.some((item) => item.accountId === id) || state.bills.some((item) => item.accountId === id))) throw new FinanceApiError(409, "account_has_dependencies", false);
    if (remote) await deleteRemoteAccount(id, apiOptions());
    dispatch({ type: "account/remove", id });
  };
  const saveTransaction = async (input: TransactionInput, id?: string, key = crypto.randomUUID()) => {
    const transaction = remote
      ? id ? await updateRemoteTransaction(id, input, apiOptions()) : await createRemoteTransaction(input, apiOptions(), key)
      : { ...input, id: id || crypto.randomUUID() };
    dispatch({ type: id ? "transaction/edit" : "transaction/add", transaction }); return transaction;
  };
  const deleteTransaction = async (id: string) => {
    if (remote) await deleteRemoteTransaction(id, apiOptions());
    dispatch({ type: "transaction/remove", id });
  };
  const saveBill = async (input: BillInput, id?: string, key = crypto.randomUUID()) => {
    const bill = remote
      ? id ? await updateRemoteBill(id, input, apiOptions()) : await createRemoteBill(input, apiOptions(), key)
      : { ...input, id: id || crypto.randomUUID(), status: "open" as const };
    dispatch({ type: id ? "bill/edit" : "bill/add", bill }); return bill;
  };
  const deleteBill = async (id: string) => {
    if (remote) await deleteRemoteBill(id, apiOptions());
    dispatch({ type: "bill/remove", id });
  };
  const payBill = async (id: string, accountId: string, paidOn: string, key = crypto.randomUUID()) => {
    if (!remote) { dispatch({ type: "bill/pay", id, accountId, paidOn }); return; }
    const result = await payRemoteBill(id, { accountId, paidOn }, apiOptions(), key);
    dispatch({ type: "bill/edit", bill: result.bill });
    dispatch({ type: "transaction/add", transaction: result.transaction });
  };
  const createCard = async (input: Omit<CreditCard, "id">, key = crypto.randomUUID()) => {
    const card = remote ? await createRemoteCard(input, apiOptions(), key) : { ...input, id: crypto.randomUUID() };
    dispatch({ type: "card/add", card }); return card;
  };

  return <FinanceContext.Provider value={{ state, dispatch, status, error, errorStatus, remote, retry, createAccount, updateAccount, deleteAccount, saveTransaction, deleteTransaction, saveBill, deleteBill, payBill, createCard }}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const value = useContext(FinanceContext);
  if (!value) throw new Error("useFinance deve ser usado dentro de FinanceProvider");
  return value;
}

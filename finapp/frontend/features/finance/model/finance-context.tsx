"use client";

import { createContext, useCallback, useContext, useEffect, useReducer, useRef, useState } from "react";
import { financeReducer, type FinanceAction } from "@/domain/finance/finance-reducer";
import type { Account, CreditCard, FinanceState } from "@/domain/finance/types";
import { useAuth } from "@/features/auth/auth-context";
import { createRemoteAccount, createRemoteCard, loadFinanceState } from "@/infrastructure/api/finance-api";
import { FinanceApiError } from "@/infrastructure/api/http-client";
import { initialFinanceState } from "./demo-state";

type FinanceStatus = "idle" | "loading" | "ready" | "empty" | "error";
type FinanceContextValue = {
  state: FinanceState;
  dispatch: React.Dispatch<FinanceAction>;
  status: FinanceStatus;
  error: string | null;
  errorStatus: number | null;
  remote: boolean;
  retry: () => void;
  createAccount: (account: Omit<Account, "id">, idempotencyKey?: string) => Promise<Account>;
  createCard: (card: Omit<CreditCard, "id">, idempotencyKey?: string) => Promise<CreditCard>;
};
const FinanceContext = createContext<FinanceContextValue | null>(null);

const emptyState = (displayName?: string | null): FinanceState => ({
  accounts: [], transactions: [], bills: [], cards: [], purchases: [], invoicePayments: [], categories: [],
  displayName: displayName || "Usuário",
});

export function FinanceProvider({ children, initialName, initialState }: { children: React.ReactNode; initialName?: string | null; initialState?: FinanceState }) {
  const controlledDemo = process.env.NODE_ENV === "test" || process.env.NEXT_PUBLIC_FINAPP_E2E_AUTH === "1";
  const testState = controlledDemo && !initialState ? initialFinanceState : initialState;
  const remote = !testState;
  const auth = useAuth();
  const [state, dispatch] = useReducer(financeReducer, testState ? { ...testState, displayName: initialName || testState.displayName } : emptyState(initialName));
  const [status, setStatus] = useState<FinanceStatus>(testState ? "ready" : "idle");
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
        setStatus("idle");
        setError(null);
        setErrorStatus(null);
      });
      return () => controller.abort();
    }

    const displayName = auth.user.displayName || initialName || "Usuário";
    queueMicrotask(() => {
      if (controller.signal.aborted) return;
      dispatch({ type: "state/clear", displayName });
      setStatus("loading");
      setError(null);
      setErrorStatus(null);
      loadFinanceState({ displayName, getToken: () => auth.user!.getIdToken(), signal: controller.signal }).then((nextState) => {
        if (controller.signal.aborted || generation.current !== currentGeneration) return;
        dispatch({ type: "state/hydrate", state: nextState });
        setStatus(nextState.accounts.length || nextState.cards.length ? "ready" : "empty");
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted || generation.current !== currentGeneration) return;
        setStatus("error");
        setError(reason instanceof FinanceApiError || reason instanceof Error ? reason.message : "Não foi possível carregar os dados financeiros.");
        setErrorStatus(reason instanceof FinanceApiError ? reason.status : null);
      });
    });

    return () => controller.abort();
  }, [auth.loading, auth.user, initialName, remote, retryVersion]);

  const apiOptions = () => {
    if (!auth.user) throw new FinanceApiError(401, "missing_user", false);
    return { displayName: state.displayName, getToken: () => auth.user!.getIdToken() };
  };
  const createAccount = async (input: Omit<Account, "id">, idempotencyKey = crypto.randomUUID()) => {
    if (!remote) {
      const account = { ...input, id: crypto.randomUUID() };
      dispatch({ type: "account/add", account });
      return account;
    }
    const account = await createRemoteAccount(input, apiOptions(), idempotencyKey);
    dispatch({ type: "account/add", account });
    return account;
  };
  const createCard = async (input: Omit<CreditCard, "id">, idempotencyKey = crypto.randomUUID()) => {
    if (!remote) {
      const card = { ...input, id: crypto.randomUUID() };
      dispatch({ type: "card/add", card });
      return card;
    }
    const card = await createRemoteCard(input, apiOptions(), idempotencyKey);
    dispatch({ type: "card/add", card });
    return card;
  };

  return <FinanceContext.Provider value={{ state, dispatch, status, error, errorStatus, remote, retry, createAccount, createCard }}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const value = useContext(FinanceContext);
  if (!value) throw new Error("useFinance deve ser usado dentro de FinanceProvider");
  return value;
}

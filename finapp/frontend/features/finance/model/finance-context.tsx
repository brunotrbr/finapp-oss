"use client";

import { createContext, useContext, useReducer } from "react";
import { financeReducer, type FinanceAction } from "@/domain/finance/finance-reducer";
import type { FinanceState } from "@/domain/finance/types";
import { initialFinanceState } from "./demo-state";

type FinanceContextValue = { state: FinanceState; dispatch: React.Dispatch<FinanceAction> };
const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children, initialName, initialState = initialFinanceState }: { children: React.ReactNode; initialName?: string | null; initialState?: FinanceState }) {
  const [state, dispatch] = useReducer(financeReducer, {
    ...initialState,
    displayName: initialName || initialState.displayName,
  });
  return <FinanceContext.Provider value={{ state, dispatch }}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const value = useContext(FinanceContext);
  if (!value) throw new Error("useFinance deve ser usado dentro de FinanceProvider");
  return value;
}

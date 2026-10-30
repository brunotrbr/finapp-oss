"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { firebaseAuth } from "@/infrastructure/firebase/client";

type AuthUser = Pick<User, "uid" | "email" | "displayName" | "getIdToken">;

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
};

const e2eAuthEnabled = () => process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_FINAPP_E2E_AUTH === "1";
const e2eUser: AuthUser = {
  uid: "e2e-user",
  email: "e2e@finapp.local",
  displayName: "Pessoa de teste",
  getIdToken: async () => "finapp-e2e-token",
};

const AuthContext = createContext<AuthState>({ user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => e2eAuthEnabled()
    ? { user: e2eUser, loading: false }
    : { user: null, loading: true });

  useEffect(() => {
    if (e2eAuthEnabled()) return;

    try {
      return onAuthStateChanged(firebaseAuth(), (user) =>
        setState({ user, loading: false })
      );
    } catch {
      // Mantém páginas públicas utilizáveis quando a configuração ou rede
      // do Firebase está indisponível; os formulários exibem o erro da ação.
      const timeoutId = window.setTimeout(
        () => setState({ user: null, loading: false }),
        0
      );
      return () => window.clearTimeout(timeoutId);
    }
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

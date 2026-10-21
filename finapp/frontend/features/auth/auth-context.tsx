"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { firebaseAuth } from "@/infrastructure/firebase/client";

type AuthState = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthState>({ user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
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

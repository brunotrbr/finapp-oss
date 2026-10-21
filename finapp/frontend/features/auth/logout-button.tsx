"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "firebase/auth";
import { firebaseAuth } from "@/infrastructure/firebase/client";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleLogout() {
    setPending(true);
    setError("");

    try {
      if (process.env.NEXT_PUBLIC_FINAPP_E2E_AUTH !== "1") {
        try {
          await signOut(firebaseAuth());
        } catch {
          // A sessão HTTP-only ainda deve ser invalidada quando o SDK cliente falhar.
        }
      }

      const response = await fetch("/api/auth/session", { method: "DELETE" });
      if (!response.ok) throw new Error("server-session");

      router.replace("/login");
      router.refresh();
    } catch {
      setError("Não foi possível encerrar a sessão. Verifique sua conexão e tente novamente.");
      setPending(false);
    }
  }

  return (
    <div className="grid justify-items-start gap-3">
      <button
        type="button"
        onClick={handleLogout}
        disabled={pending}
        aria-describedby={error ? "logout-error" : undefined}
        className="min-h-11 rounded-xl border border-red-300 px-5 text-base font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
      >
        {pending ? "Encerrando…" : "Encerrar sessão"}
      </button>
      {error && <p id="logout-error" role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

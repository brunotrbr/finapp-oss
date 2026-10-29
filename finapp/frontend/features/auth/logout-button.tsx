"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { signOut } from "firebase/auth";
import { firebaseAuth } from "@/infrastructure/firebase/client";
import { dangerButtonClass } from "@/shared/ui/styles";

export function LogoutButton({ menuItem = false, label = "Encerrar sessão" }: { menuItem?: boolean; label?: string }) {
  const router = useRouter();
  const errorId = useId();
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
        role={menuItem ? "menuitem" : undefined}
        onClick={handleLogout}
        disabled={pending}
        aria-describedby={error ? errorId : undefined}
        className={menuItem
          ? "flex min-h-11 w-full items-center rounded-xl px-3 text-left text-sm font-semibold text-expense transition hover:bg-expense-container"
          : dangerButtonClass}
      >
        {pending ? "Encerrando…" : label}
      </button>
      {error && <p id={errorId} role="alert" className="rounded-xl bg-expense-container p-3 text-sm text-expense">{error}</p>}
    </div>
  );
}

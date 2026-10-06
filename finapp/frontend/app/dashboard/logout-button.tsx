"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleLogout() {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/auth/session", { method: "DELETE" });
      if (!response.ok) throw new Error("session");
      await signOut(firebaseAuth());
      router.replace("/login");
      router.refresh();
    } catch {
      setError("Não foi possível sair. Tente novamente.");
      setPending(false);
    }
  }

  return (
    <div role="none" className="flex flex-col gap-2">
      <button
        type="button"
        role="menuitem"
        onClick={handleLogout}
        disabled={pending}
        className="flex min-h-11 w-full items-center rounded-[8px] px-3 py-2 text-left text-[13px] font-medium text-royal transition-colors hover:bg-paper-deep focus:bg-paper-deep disabled:opacity-50"
      >
        {pending ? "Saindo…" : "Sair"}
      </button>
      {error && <p role="alert" className="px-3 pb-2 text-[11px] text-ink">{error}</p>}
    </div>
  );
}

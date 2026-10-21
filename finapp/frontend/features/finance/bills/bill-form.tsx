"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { positiveAmountError, requiredError } from "@/domain/finance/validation";
import { useFinance } from "@/features/finance/model/finance-context";
import { Field } from "@/shared/ui/field";
import { EmptyState } from "@/shared/ui/feedback";
import { PageHeader } from "@/shared/ui/page-header";
import { buttonClass, inputClass } from "@/shared/ui/styles";

export function BillForm() {
  const { state, dispatch } = useFinance();
  const router = useRouter();
  const [error, setError] = useState<{ field: "description" | "amount" | "dueDate" | "accountId"; message: string } | null>(null);
  if (!state.accounts.length) return <EmptyState>Cadastre uma conta primeiro.</EmptyState>;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const description = String(data.get("description") || "");
    const amount = Number(data.get("amount"));
    const dueDate = String(data.get("dueDate") || "");
    const accountId = String(data.get("accountId") || "");
    const amountValidation = positiveAmountError(amount);
    if (requiredError(description)) { setError({ field: "description", message: "Informe a descrição." }); return; }
    if (amountValidation) { setError({ field: "amount", message: amountValidation }); return; }
    if (requiredError(dueDate)) { setError({ field: "dueDate", message: "Informe o vencimento." }); return; }
    if (!state.accounts.some(({ id }) => id === accountId)) { setError({ field: "accountId", message: "Selecione uma conta válida." }); return; }
    dispatch({ type: "bill/add", bill: { id: `bill-${Date.now()}`, description: description.trim(), amount, dueDate, accountId } });
    router.push("/dashboard/bills");
  }

  return <div className="space-y-6"><PageHeader title="Nova pendência" /><form onSubmit={submit} className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"><Field label="Descrição" error={error?.field === "description" ? error.message : null}><input className={inputClass} name="description" required /></Field><Field label="Valor (R$)" error={error?.field === "amount" ? error.message : null}><input className={inputClass} name="amount" type="number" min="0.01" step="0.01" required /></Field><Field label="Vencimento" error={error?.field === "dueDate" ? error.message : null}><input className={inputClass} name="dueDate" type="date" defaultValue="2026-10-28" required /></Field><Field label="Conta vinculada" error={error?.field === "accountId" ? error.message : null}><select className={inputClass} name="accountId">{state.accounts.map((account) => <option value={account.id} key={account.id}>{account.name}</option>)}</select></Field><button className={buttonClass}>Salvar pendência</button></form></div>;
}

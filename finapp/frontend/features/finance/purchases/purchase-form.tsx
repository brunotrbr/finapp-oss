"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { installmentsError, positiveAmountError, requiredError } from "@/domain/finance/validation";
import { DEMO_DATE } from "@/features/finance/model/demo-state";
import { useFinance } from "@/features/finance/model/finance-context";
import { newId } from "@/features/finance/model/new-id";
import { Field } from "@/shared/ui/field";
import { MissingEntity } from "@/shared/ui/feedback";
import { PageHeader } from "@/shared/ui/page-header";
import { buttonClass, inputClass } from "@/shared/ui/styles";

export function PurchaseForm({ cardId }: { cardId: string }) {
  const { state, dispatch } = useFinance();
  const router = useRouter();
  const [error, setError] = useState<{ field: "description" | "amount" | "date" | "installments"; message: string } | null>(null);
  const card = state.cards.find(({ id }) => id === cardId);
  if (!card) return <MissingEntity label="Cartão" href="/dashboard/cards" />;
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const description = String(data.get("description") || "");
    const amount = Number(data.get("amount"));
    const date = String(data.get("date") || "");
    const installments = Number(data.get("installments"));
    const amountValidation = positiveAmountError(amount);
    const installmentsValidation = installmentsError(installments);
    if (requiredError(description)) { setError({ field: "description", message: "Informe a descrição." }); return; }
    if (amountValidation) { setError({ field: "amount", message: amountValidation }); return; }
    if (requiredError(date)) { setError({ field: "date", message: "Informe a data." }); return; }
    if (installmentsValidation) { setError({ field: "installments", message: installmentsValidation }); return; }
    dispatch({ type: "purchase/add", purchase: { id: newId("purchase"), cardId, description: description.trim(), amount, date, installments } });
    router.push(`/dashboard/cards/${cardId}`);
  }
  return <div className="space-y-6"><PageHeader title="Nova compra" eyebrow={card.name} /><form onSubmit={submit} className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"><Field label="Descrição" error={error?.field === "description" ? error.message : null}><input className={inputClass} name="description" required /></Field><Field label="Valor total (R$)" error={error?.field === "amount" ? error.message : null}><input className={inputClass} name="amount" type="number" min="0.01" step="0.01" required /></Field><Field label="Data" error={error?.field === "date" ? error.message : null}><input className={inputClass} name="date" type="date" defaultValue={DEMO_DATE} required /></Field><Field label="Parcelas" error={error?.field === "installments" ? error.message : null}><input className={inputClass} name="installments" type="number" min="1" step="1" defaultValue="1" required /></Field><button className={buttonClass}>Salvar compra</button></form></div>;
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { dayError, positiveAmountError, requiredError } from "@/domain/finance/validation";
import { useFinance } from "@/features/finance/model/finance-context";
import { newId } from "@/features/finance/model/new-id";
import { Field } from "@/shared/ui/field";
import { PageHeader } from "@/shared/ui/page-header";
import { buttonClass, inputClass } from "@/shared/ui/styles";

export function CardForm() {
  const { dispatch } = useFinance();
  const router = useRouter();
  const [error, setError] = useState<{ field: "name" | "limit" | "closingDay" | "dueDay"; message: string } | null>(null);
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") || "");
    const limit = Number(data.get("limit"));
    const closingDay = Number(data.get("closingDay"));
    const dueDay = Number(data.get("dueDay"));
    const limitValidation = positiveAmountError(limit);
    const closingValidation = dayError(closingDay);
    const dueValidation = dayError(dueDay);
    if (requiredError(name)) { setError({ field: "name", message: "Informe o nome do cartão." }); return; }
    if (limitValidation) { setError({ field: "limit", message: limitValidation }); return; }
    if (closingValidation) { setError({ field: "closingDay", message: closingValidation }); return; }
    if (dueValidation) { setError({ field: "dueDay", message: dueValidation }); return; }
    const id = newId("card");
    dispatch({ type: "card/add", card: { id, name: name.trim(), limit, closingDay, dueDay } });
    router.push(`/dashboard/cards/${id}`);
  }
  return <div className="space-y-6"><PageHeader title="Cadastrar cartão" /><form onSubmit={submit} className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"><Field label="Nome" error={error?.field === "name" ? error.message : null}><input className={inputClass} name="name" required /></Field><Field label="Limite (R$)" error={error?.field === "limit" ? error.message : null}><input className={inputClass} name="limit" type="number" min="0.01" step="0.01" required /></Field><Field label="Dia de fechamento" error={error?.field === "closingDay" ? error.message : null}><input className={inputClass} name="closingDay" type="number" min="1" max="31" step="1" defaultValue="20" required /></Field><Field label="Dia de vencimento" error={error?.field === "dueDay" ? error.message : null}><input className={inputClass} name="dueDay" type="number" min="1" max="31" step="1" defaultValue="28" required /></Field><button className={buttonClass}>Salvar cartão</button></form></div>;
}

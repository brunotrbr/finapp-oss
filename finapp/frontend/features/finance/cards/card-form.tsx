"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { dayError, positiveAmountError, requiredError } from "@/domain/finance/validation";
import { useFinance } from "@/features/finance/model/finance-context";
import { Field } from "@/shared/ui/field";
import { Notice } from "@/shared/ui/feedback";
import { PageHeader } from "@/shared/ui/page-header";
import { buttonClass, formCardClass, inputClass } from "@/shared/ui/styles";

export function CardForm() {
  const { createCard, remote } = useFinance();
  const router = useRouter();
  const [error, setError] = useState<{ field: "name" | "limit" | "closingDay" | "dueDay"; message: string } | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submission = useRef<{ fingerprint: string; key: string } | null>(null);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") || ""); const limit = Number(data.get("limit")); const closingDay = Number(data.get("closingDay")); const dueDay = Number(data.get("dueDay"));
    const limitValidation = positiveAmountError(limit); const closingValidation = dayError(closingDay); const dueValidation = dayError(dueDay);
    if (requiredError(name)) { setError({ field: "name", message: "Informe o nome do cartão." }); return; }
    if (limitValidation) { setError({ field: "limit", message: limitValidation }); return; }
    if (closingValidation) { setError({ field: "closingDay", message: closingValidation }); return; }
    if (dueValidation) { setError({ field: "dueDay", message: dueValidation }); return; }
    const next = { name: name.trim(), limit, closingDay, dueDay };
    const fingerprint = JSON.stringify(next);
    if (submission.current?.fingerprint !== fingerprint) submission.current = { fingerprint, key: crypto.randomUUID() };
    setSubmitting(true); setRequestError(null);
    try { const card = await createCard(next, submission.current.key); submission.current = null; router.push(`/dashboard/cards/${card.id}`); }
    catch (reason) { setRequestError(reason instanceof Error ? reason.message : "Não foi possível salvar o cartão."); }
    finally { setSubmitting(false); }
  }
  return <div className="space-y-6"><PageHeader title="Cadastrar cartão" eyebrow="Crédito" /><form onSubmit={submit} className={formCardClass}><Field label="Nome" error={error?.field === "name" ? error.message : null}><input className={inputClass} name="name" required /></Field><Field label="Limite (R$)" error={error?.field === "limit" ? error.message : null}><input className={inputClass} name="limit" type="number" min="0.01" step="0.01" required /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Dia de fechamento" error={error?.field === "closingDay" ? error.message : null}><input className={inputClass} name="closingDay" type="number" min="1" max="31" step="1" defaultValue="20" required /></Field><Field label="Dia de vencimento" error={error?.field === "dueDay" ? error.message : null}><input className={inputClass} name="dueDay" type="number" min="1" max="31" step="1" defaultValue="28" required /></Field></div>{requestError && <p role="alert" className="text-sm text-expense">{requestError}</p>}<button className={`${buttonClass} w-full`} disabled={submitting}>{submitting ? "Salvando…" : "Salvar cartão"}</button></form><Notice>{remote ? "O cartão só aparece após confirmação da API." : "Ambiente de teste local sem persistência."}</Notice></div>;
}

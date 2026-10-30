"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { positiveAmountError, requiredError } from "@/domain/finance/validation";
import { useFinance } from "@/features/finance/model/finance-context";
import { fieldErrorFor } from "@/features/finance/model/api-errors";
import { submissionFor, type PendingSubmission } from "@/features/finance/model/submission";
import { Field } from "@/shared/ui/field";
import { EmptyState, MissingEntity } from "@/shared/ui/feedback";
import { PageHeader } from "@/shared/ui/page-header";
import { buttonClass, formCardClass, inputClass } from "@/shared/ui/styles";

export function BillForm({ billId }: { billId?: string }) {
  const { state, saveBill } = useFinance();
  const router = useRouter();
  const bill = billId ? state.bills.find(({ id }) => id === billId) : undefined;
  const [error, setError] = useState<{ field: "description" | "amount" | "dueDate" | "accountId"; message: string } | null>(null);
  const [requestError, setRequestError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submission = useRef<PendingSubmission | null>(null);
  if (billId && !bill) return <MissingEntity label="Pendência" href="/dashboard/bills" />;
  if (bill?.status === "paid") return <EmptyState>Pendências pagas permanecem no histórico e não podem ser editadas. <Link className="underline" href={`/dashboard/bills/${bill.id}`}>Voltar</Link></EmptyState>;
  if (!state.accounts.length) return <EmptyState>Cadastre uma conta primeiro.</EmptyState>;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
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
    const next = { description: description.trim(), amount, dueDate, accountId };
    submission.current = submissionFor(submission.current, next);
    setSubmitting(true); setRequestError(""); setError(null);
    try { await saveBill(next, bill?.id, submission.current.key); submission.current = null; router.push("/dashboard/bills"); }
    catch (reason) {
      const fieldError = fieldErrorFor(reason, { description: "description", amount: "amount", amountCents: "amount", dueDate: "dueDate", accountId: "accountId" });
      if (fieldError) setError(fieldError); else setRequestError(reason instanceof Error ? reason.message : "Não foi possível salvar a pendência.");
    }
    finally { setSubmitting(false); }
  }

  return <div className="space-y-6"><PageHeader title={bill ? "Editar pendência" : "Nova pendência"} eyebrow="Compromisso" /><form onSubmit={submit} className={formCardClass}><Field label="Descrição" error={error?.field === "description" ? error.message : null}><input className={inputClass} name="description" required defaultValue={bill?.description} /></Field><Field label="Valor (R$)" error={error?.field === "amount" ? error.message : null}><input className={inputClass} name="amount" type="number" min="0.01" step="0.01" required defaultValue={bill?.amount} /></Field><Field label="Vencimento" error={error?.field === "dueDate" ? error.message : null}><input className={inputClass} name="dueDate" type="date" defaultValue={bill?.dueDate || new Date().toISOString().slice(0, 10)} required /></Field><Field label="Conta vinculada" error={error?.field === "accountId" ? error.message : null}><select className={inputClass} name="accountId" defaultValue={bill?.accountId || state.accounts[0].id}>{state.accounts.map((account) => <option value={account.id} key={account.id}>{account.name}</option>)}</select></Field>{requestError && <p role="alert" className="text-sm text-expense">{requestError}</p>}<button className={`${buttonClass} w-full`} disabled={submitting}>{submitting ? "Salvando…" : "Salvar pendência"}</button></form></div>;
}

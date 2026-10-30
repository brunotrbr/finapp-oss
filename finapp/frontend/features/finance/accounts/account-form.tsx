"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { Account } from "@/domain/finance/types";
import { requiredError } from "@/domain/finance/validation";
import { useFinance } from "@/features/finance/model/finance-context";
import { fieldErrorFor } from "@/features/finance/model/api-errors";
import { submissionFor, type PendingSubmission } from "@/features/finance/model/submission";
import { Field } from "@/shared/ui/field";
import { MissingEntity, Notice } from "@/shared/ui/feedback";
import { PageHeader } from "@/shared/ui/page-header";
import { buttonClass, inputClass, secondaryButtonClass } from "@/shared/ui/styles";

export function AccountForm({ accountId }: { accountId?: string }) {
  const { state, createAccount, updateAccount, remote } = useFinance();
  const router = useRouter();
  const account = accountId ? state.accounts.find(({ id }) => id === accountId) : undefined;
  const [error, setError] = useState<{ field: "name" | "bank" | "initialBalance" | "type"; message: string } | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submission = useRef<PendingSubmission | null>(null);
  if (accountId && !account) return <MissingEntity label="Conta" href="/dashboard/accounts" />;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") || "");
    const initialBalance = Number(data.get("initialBalance"));
    const type = String(data.get("type") || "");
    if (requiredError(name)) { setError({ field: "name", message: "Informe o nome da conta." }); return; }
    if (!Number.isFinite(initialBalance)) { setError({ field: "initialBalance", message: "Informe um saldo inicial válido." }); return; }
    if (!(["Corrente", "Poupança", "Carteira"] as string[]).includes(type)) { setError({ field: "type", message: "Selecione um tipo de conta válido." }); return; }
    const next: Omit<Account, "id"> = { name: name.trim(), bank: String(data.get("bank") || "").trim(), type: type as Account["type"], initialBalance };
    if (account) {
      setSubmitting(true); setRequestError(null);
      try { await updateAccount(account.id, next); router.push(`/dashboard/accounts/${account.id}`); }
      catch (reason) {
        const fieldError = fieldErrorFor(reason, { name: "name", bank: "bank", type: "type", initialBalance: "initialBalance", initialBalanceCents: "initialBalance" });
        if (fieldError) setError(fieldError); else setRequestError(reason instanceof Error ? reason.message : "Não foi possível atualizar a conta.");
      }
      finally { setSubmitting(false); }
      return;
    }
    submission.current = submissionFor(submission.current, next);
    setSubmitting(true); setRequestError(null);
    try { const created = await createAccount(next, submission.current.key); submission.current = null; router.push(`/dashboard/accounts/${created.id}`); }
    catch (reason) {
      const fieldError = fieldErrorFor(reason, { name: "name", bank: "bank", type: "type", initialBalance: "initialBalance", initialBalanceCents: "initialBalance" });
      if (fieldError) setError(fieldError); else setRequestError(reason instanceof Error ? reason.message : "Não foi possível salvar a conta.");
    }
    finally { setSubmitting(false); }
  }

  return <div className="space-y-6">
    <PageHeader title="Configurar conta" eyebrow={account ? "Editar conta bancária" : "Nova conta bancária"} description="A conta permanece separada do cadastro de cartões e segue suas próprias regras de saldo." />
    <form onSubmit={submit} className="space-y-5">
      <fieldset className="rounded-3xl border border-border-subtle bg-surface p-5 shadow-sm"><legend className="mb-3 text-sm font-semibold">Modalidade da conta</legend><div className="flex flex-wrap gap-2">{(["Corrente", "Poupança", "Carteira"] as Account["type"][]).map((type) => <label key={type} className="flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-border px-4 text-sm font-semibold transition has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-on-primary has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-secondary/60"><input aria-label={type} className="sr-only" type="radio" name="type" value={type} defaultChecked={(account?.type || "Corrente") === type} />{type}</label>)}</div>{error?.field === "type" && <p role="alert" className="mt-2 text-sm text-expense">{error.message}</p>}</fieldset>
      <section className="grid gap-5 rounded-3xl border border-border-subtle bg-surface p-5 shadow-sm sm:p-6" aria-label="Identificação da conta"><Field label="Instituição financeira (opcional)" error={error?.field === "bank" ? error.message : null}><input className={inputClass} name="bank" defaultValue={account?.bank} /></Field><Field label="Nome da conta" error={error?.field === "name" ? error.message : null}><input className={inputClass} name="name" required defaultValue={account?.name} /></Field></section>
      <section className="rounded-3xl border border-border-subtle bg-surface p-5 shadow-sm sm:p-6"><Field label="Saldo inicial (R$)" error={error?.field === "initialBalance" ? error.message : null}><input className={`${inputClass} min-h-16 text-3xl font-bold tabular-nums`} name="initialBalance" type="number" step="0.01" required defaultValue={account?.initialBalance ?? 0} /></Field><p className="mt-3 text-xs leading-5 text-muted">Informe quanto havia nesta conta antes dos lançamentos registrados.</p></section>
      {requestError && <p role="alert" className="text-sm text-expense">{requestError}</p>}
      <div className="sticky bottom-20 z-20 -mx-4 flex gap-3 border-t border-border-subtle bg-background/95 p-4 backdrop-blur lg:static lg:mx-0 lg:justify-end lg:border-0 lg:bg-transparent lg:p-0"><button className={`${secondaryButtonClass} flex-1 lg:flex-none`} type="button" onClick={() => router.push(account ? `/dashboard/accounts/${account.id}` : "/dashboard/accounts")}>Cancelar</button><button className={`${buttonClass} flex-[2] lg:flex-none lg:min-w-52`} type="submit" disabled={submitting}>{submitting ? "Salvando…" : "Salvar conta"}</button></div>
    </form>
    <Notice>{remote ? "As alterações são confirmadas pela API antes de aparecerem na conta." : "Modo demo local: alterações são reiniciadas ao recarregar."}</Notice>
  </div>;
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Transaction } from "@/domain/finance/types";
import { positiveAmountError, requiredError } from "@/domain/finance/validation";
import { DEMO_DATE } from "@/features/finance/model/demo-state";
import { useFinance } from "@/features/finance/model/finance-context";
import { newId } from "@/features/finance/model/new-id";
import { Field } from "@/shared/ui/field";
import { EmptyState, MissingEntity } from "@/shared/ui/feedback";
import { PageHeader } from "@/shared/ui/page-header";
import { buttonClass, formCardClass, inputClass } from "@/shared/ui/styles";

export function TransactionForm({ transactionId, initialAccountId }: { transactionId?: string; initialAccountId?: string }) {
  const { state, dispatch, remote } = useFinance();
  const router = useRouter();
  const transaction = transactionId ? state.transactions.find(({ id }) => id === transactionId) : undefined;
  const [error, setError] = useState<{ field: "accountId" | "description" | "amount" | "date" | "category"; message: string } | null>(null);

  if (transactionId && !transaction) return <MissingEntity label="Lançamento" href="/dashboard/accounts" />;
  if (remote) return <EmptyState>Criação e edição de lançamentos ficam indisponíveis até a API oferecer esses endpoints.</EmptyState>;
  if (!state.accounts.length) return <EmptyState>Cadastre uma conta antes de lançar. <Link className="underline" href="/dashboard/accounts/new">Nova conta</Link></EmptyState>;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const magnitude = Number(data.get("amount"));
    const description = String(data.get("description") || "");
    const accountId = String(data.get("accountId") || "");
    const date = String(data.get("date") || "");
    const category = String(data.get("category") || "");
    const amountError = positiveAmountError(magnitude);
    if (!state.accounts.some(({ id }) => id === accountId)) { setError({ field: "accountId", message: "Selecione uma conta válida." }); return; }
    if (requiredError(description)) { setError({ field: "description", message: "Informe a descrição." }); return; }
    if (amountError) { setError({ field: "amount", message: amountError }); return; }
    if (requiredError(date)) { setError({ field: "date", message: "Informe a data." }); return; }
    if (!state.categories.includes(category)) { setError({ field: "category", message: "Selecione uma categoria válida." }); return; }
    const next: Transaction = {
      id: transaction?.id || newId("transaction"), accountId, description: description.trim(),
      amount: magnitude * (data.get("direction") === "debit" ? -1 : 1), date,
      category, note: String(data.get("note") || "").trim(),
    };
    dispatch({ type: transaction ? "transaction/edit" : "transaction/add", transaction: next });
    router.push(`/dashboard/accounts/${accountId}`);
  }

  const defaultDirection = transaction && transaction.amount > 0 ? "credit" : "debit";
  const directionClass = "flex min-h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition has-[:checked]:bg-primary has-[:checked]:text-on-primary has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-secondary/60";

  return <div className="space-y-6">
    <PageHeader title={transaction ? "Editar lançamento" : "Novo lançamento"} eyebrow="Movimentação" description="Registre uma entrada ou saída mantendo conta e categoria vinculadas." />
    <form onSubmit={submit} className="space-y-5">
      <fieldset className="rounded-3xl border border-border-subtle bg-surface p-2 shadow-sm"><legend className="sr-only">Tipo</legend><div className="flex rounded-2xl bg-surface-subtle p-1.5"><label className={directionClass}><input aria-label="Saída" className="sr-only" type="radio" name="direction" value="debit" defaultChecked={defaultDirection === "debit"} /><span aria-hidden>↓</span> Saída</label><label className={directionClass}><input aria-label="Entrada" className="sr-only" type="radio" name="direction" value="credit" defaultChecked={defaultDirection === "credit"} /><span aria-hidden>↑</span> Entrada</label></div></fieldset>
      <section className="rounded-3xl border border-border-subtle bg-surface p-5 text-center shadow-[0_18px_50px_-38px_rgba(15,118,110,0.55)] sm:p-7" aria-labelledby="transaction-value"><p id="transaction-value" className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Valor da movimentação</p><div className="mx-auto mt-3 max-w-sm"><Field label="Valor (R$)" error={error?.field === "amount" ? error.message : null}><input name="amount" className={`${inputClass} min-h-16 text-center text-3xl font-bold tabular-nums`} type="number" min="0.01" step="0.01" required defaultValue={transaction ? Math.abs(transaction.amount) : undefined} /></Field></div></section>
      <div className={formCardClass}>
        <Field label="Descrição" error={error?.field === "description" ? error.message : null}><input name="description" className={inputClass} required defaultValue={transaction?.description} /></Field>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Data" error={error?.field === "date" ? error.message : null}><input name="date" className={inputClass} type="date" required defaultValue={transaction?.date || DEMO_DATE} /></Field><Field label="Conta" error={error?.field === "accountId" ? error.message : null}><select name="accountId" className={inputClass} defaultValue={transaction?.accountId || (state.accounts.some(({ id }) => id === initialAccountId) ? initialAccountId : state.accounts[0].id)}>{state.accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></Field></div>
        <Field label="Categoria" error={error?.field === "category" ? error.message : null}><select name="category" className={inputClass} defaultValue={transaction?.category}>{state.categories.map((category) => <option key={category}>{category}</option>)}</select></Field>
        <Field label="Observações"><textarea name="note" className={`${inputClass} min-h-24 resize-y`} defaultValue={transaction?.note} /></Field>
      </div>
      <div className="sticky bottom-20 z-20 -mx-4 flex justify-end border-t border-border-subtle bg-background/95 p-4 backdrop-blur lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0"><button className={`${buttonClass} w-full sm:w-auto sm:min-w-64`}>Salvar lançamento</button></div>
    </form>
  </div>;
}

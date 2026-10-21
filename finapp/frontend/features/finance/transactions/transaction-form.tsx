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
  const { state, dispatch } = useFinance();
  const router = useRouter();
  const transaction = transactionId ? state.transactions.find(({ id }) => id === transactionId) : undefined;
  const [error, setError] = useState<{ field: "accountId" | "description" | "amount" | "date"; message: string } | null>(null);

  if (transactionId && !transaction) return <MissingEntity label="Lançamento" href="/dashboard/accounts" />;
  if (!state.accounts.length) return <EmptyState>Cadastre uma conta antes de lançar. <Link className="underline" href="/dashboard/accounts/new">Nova conta</Link></EmptyState>;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const magnitude = Number(data.get("amount"));
    const description = String(data.get("description") || "");
    const accountId = String(data.get("accountId") || "");
    const date = String(data.get("date") || "");
    const amountError = positiveAmountError(magnitude);
    if (!state.accounts.some(({ id }) => id === accountId)) { setError({ field: "accountId", message: "Selecione uma conta válida." }); return; }
    if (requiredError(description)) { setError({ field: "description", message: "Informe a descrição." }); return; }
    if (amountError) { setError({ field: "amount", message: amountError }); return; }
    if (requiredError(date)) { setError({ field: "date", message: "Informe a data." }); return; }
    const next: Transaction = {
      id: transaction?.id || newId("transaction"), accountId, description: description.trim(),
      amount: magnitude * (data.get("direction") === "debit" ? -1 : 1), date,
      category: String(data.get("category")), note: String(data.get("note") || "").trim(),
    };
    dispatch({ type: transaction ? "transaction/edit" : "transaction/add", transaction: next });
    router.push(`/dashboard/accounts/${accountId}`);
  }

  const defaultDirection = transaction && transaction.amount > 0 ? "credit" : "debit";
  const directionClass = "flex min-h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition has-[:checked]:bg-primary has-[:checked]:text-on-primary has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-secondary/60";

  return <div className="space-y-6"><PageHeader title={transaction ? "Editar lançamento" : "Novo lançamento"} eyebrow="Movimentação" /><form onSubmit={submit} className={formCardClass}><fieldset><legend className="mb-2 text-sm font-medium">Tipo</legend><div className="flex rounded-2xl bg-surface-subtle p-1.5"><label className={directionClass}><input className="sr-only" type="radio" name="direction" value="debit" defaultChecked={defaultDirection === "debit"} />Saída</label><label className={directionClass}><input className="sr-only" type="radio" name="direction" value="credit" defaultChecked={defaultDirection === "credit"} />Entrada</label></div></fieldset><Field label="Valor (R$)" error={error?.field === "amount" ? error.message : null}><input name="amount" className={`${inputClass} text-2xl font-bold tabular-nums`} type="number" min="0.01" step="0.01" required defaultValue={transaction ? Math.abs(transaction.amount) : undefined} /></Field><Field label="Descrição" error={error?.field === "description" ? error.message : null}><input name="description" className={inputClass} required defaultValue={transaction?.description} /></Field><Field label="Data" error={error?.field === "date" ? error.message : null}><input name="date" className={inputClass} type="date" required defaultValue={transaction?.date || DEMO_DATE} /></Field><Field label="Conta" error={error?.field === "accountId" ? error.message : null}><select name="accountId" className={inputClass} defaultValue={transaction?.accountId || (state.accounts.some(({ id }) => id === initialAccountId) ? initialAccountId : state.accounts[0].id)}>{state.accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></Field><Field label="Categoria"><select name="category" className={inputClass} defaultValue={transaction?.category}>{state.categories.map((category) => <option key={category}>{category}</option>)}</select></Field><Field label="Observações"><textarea name="note" className={inputClass} defaultValue={transaction?.note} /></Field><button className={`${buttonClass} w-full`}>Salvar lançamento</button></form></div>;
}

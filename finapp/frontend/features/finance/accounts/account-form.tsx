"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Account } from "@/domain/finance/types";
import { requiredError } from "@/domain/finance/validation";
import { useFinance } from "@/features/finance/model/finance-context";
import { newId } from "@/features/finance/model/new-id";
import { Field } from "@/shared/ui/field";
import { MissingEntity, Notice } from "@/shared/ui/feedback";
import { PageHeader } from "@/shared/ui/page-header";
import { buttonClass, inputClass } from "@/shared/ui/styles";

export function AccountForm({ accountId }: { accountId?: string }) {
  const { state, dispatch } = useFinance();
  const router = useRouter();
  const account = accountId ? state.accounts.find(({ id }) => id === accountId) : undefined;
  const [error, setError] = useState<{ field: "name" | "initialBalance"; message: string } | null>(null);

  if (accountId && !account) return <MissingEntity label="Conta" href="/dashboard/accounts" />;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") || "");
    const initialBalance = Number(data.get("initialBalance"));
    if (requiredError(name)) {
      setError({ field: "name", message: "Informe o nome da conta." });
      return;
    }
    if (!Number.isFinite(initialBalance)) {
      setError({ field: "initialBalance", message: "Informe um saldo inicial válido." });
      return;
    }
    const next: Account = {
      id: account?.id || newId("account"),
      name: name.trim(),
      bank: String(data.get("bank") || "").trim(),
      type: String(data.get("type")) as Account["type"],
      initialBalance,
    };
    dispatch({ type: account ? "account/edit" : "account/add", account: next });
    router.push(`/dashboard/accounts/${next.id}`);
  }

  return (
    <div className="space-y-6">
      <PageHeader title={account ? "Editar conta" : "Cadastrar conta"} />
      <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <Field label="Nome da conta" error={error?.field === "name" ? error.message : null}><input className={inputClass} name="name" required defaultValue={account?.name} /></Field>
        <Field label="Instituição"><input className={inputClass} name="bank" defaultValue={account?.bank} /></Field>
        <Field label="Tipo"><select className={inputClass} name="type" defaultValue={account?.type || "Corrente"}><option>Corrente</option><option>Poupança</option><option>Carteira</option></select></Field>
        <Field label="Saldo inicial (R$)" error={error?.field === "initialBalance" ? error.message : null}><input className={inputClass} name="initialBalance" type="number" step="0.01" required defaultValue={account?.initialBalance ?? 0} /></Field>
        <button className={buttonClass} type="submit">Salvar conta</button>
      </form>
      <Notice>Regra demonstrativa: saldo inicial + lançamentos. Não há persistência nesta versão.</Notice>
    </div>
  );
}

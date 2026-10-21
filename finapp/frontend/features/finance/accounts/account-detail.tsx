"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { accountBalance, formatDate, formatMoney } from "@/domain/finance/calculations";
import { useFinance } from "@/features/finance/model/finance-context";
import { Card } from "@/shared/ui/card";
import { ConfirmButton } from "@/shared/ui/confirm-button";
import { EntityRow } from "@/shared/ui/entity-row";
import { Field } from "@/shared/ui/field";
import { EmptyState, MissingEntity } from "@/shared/ui/feedback";
import { PageHeader } from "@/shared/ui/page-header";
import { buttonClass, inputClass, secondaryButtonClass } from "@/shared/ui/styles";

export function AccountDetail({ accountId }: { accountId: string }) {
  const { state, dispatch } = useFinance();
  const router = useRouter();
  const [period, setPeriod] = useState("all");
  const [message, setMessage] = useState("");
  const account = state.accounts.find(({ id }) => id === accountId);

  if (!account) return <MissingEntity label="Conta" href="/dashboard/accounts" />;

  const transactions = state.transactions
    .filter((item) => item.accountId === account.id && (period === "all" || item.date.startsWith(period)))
    .sort((a, b) => b.date.localeCompare(a.date));
  const remove = () => {
    const hasTransactions = state.transactions.some((item) => item.accountId === account.id);
    const hasBills = state.bills.some((item) => item.accountId === account.id);
    if (hasTransactions || hasBills) {
      setMessage(`Remova ${hasTransactions && hasBills ? "os lançamentos e as pendências" : hasTransactions ? "os lançamentos" : "as pendências"} antes de excluir esta conta.`);
      return;
    }
    dispatch({ type: "account/remove", id: account.id });
    router.push("/dashboard/accounts");
  };

  return (
    <div className="space-y-6">
      <PageHeader title={account.name} eyebrow={`${account.bank} • ${account.type}`} action={<Link className={secondaryButtonClass} href={`/dashboard/accounts/${account.id}/edit`}>Editar</Link>} />
      <Card className="bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"><p className="text-sm opacity-70">Saldo atual</p><p className="mt-2 text-3xl font-bold">{formatMoney(accountBalance(account, state.transactions))}</p></Card>
      <div className="flex flex-wrap gap-3"><Link className={buttonClass} href={`/dashboard/transactions/new?account=${account.id}`}>Novo lançamento</Link><ConfirmButton label="Excluir conta" title="Excluir esta conta?" description="A conta só pode ser excluída quando não possui lançamentos nem pendências." onConfirm={remove} /></div>
      {message && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{message}</p>}
      <section className="space-y-3">
        <div className="flex items-end justify-between gap-4"><h2 className="text-lg font-bold">Extrato</h2><Field label="Período"><select className={inputClass} value={period} onChange={(event) => setPeriod(event.target.value)}><option value="all">Todas as datas</option><option value="2026-10">Outubro/2026</option><option value="2026-09">Setembro/2026</option></select></Field></div>
        {transactions.length ? <Card>{transactions.map((transaction) => <EntityRow key={transaction.id} title={transaction.description} subtitle={`${formatDate(transaction.date)} • ${transaction.category}`} value={formatMoney(transaction.amount)} href={`/dashboard/transactions/${transaction.id}`} />)}</Card> : <EmptyState>Nenhum lançamento no período.</EmptyState>}
      </section>
    </div>
  );
}

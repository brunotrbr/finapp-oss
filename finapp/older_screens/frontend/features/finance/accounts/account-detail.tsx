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
  const [destinationId, setDestinationId] = useState("");
  const account = state.accounts.find(({ id }) => id === accountId);

  if (!account) return <MissingEntity label="Conta" href="/dashboard/accounts" />;

  const transactions = state.transactions
    .filter((item) => item.accountId === account.id && (period === "all" || item.date.startsWith(period)))
    .sort((a, b) => b.date.localeCompare(a.date));
  const remove = () => {
    const hasTransactions = state.transactions.some((item) => item.accountId === account.id);
    const hasBills = state.bills.some((item) => item.accountId === account.id);
    if (hasTransactions || hasBills) {
      if (!destinationId) {
        setMessage(`Remova ${hasTransactions && hasBills ? "os lançamentos e as pendências" : hasTransactions ? "os lançamentos" : "as pendências"} ou selecione uma conta de destino antes de excluir esta conta.`);
        return;
      }
      dispatch({ type: "account/remove-and-reclassify", id: account.id, destinationId });
    } else {
      dispatch({ type: "account/remove", id: account.id });
    }
    router.push("/dashboard/accounts/deletion-success");
  };

  return (
    <div className="space-y-6">
      <PageHeader title={account.name} eyebrow={`${account.bank} • ${account.type}`} action={<Link className={secondaryButtonClass} href={`/dashboard/accounts/${account.id}/edit`}>Editar</Link>} />
      <Card className="border-0 bg-gradient-to-br from-on-primary-container to-primary text-on-primary shadow-xl shadow-primary/15"><p className="text-sm font-medium">Saldo atual</p><p className="mt-2 text-4xl font-bold tracking-tight tabular-nums">{formatMoney(accountBalance(account, state.transactions))}</p><p className="mt-3 text-xs">Saldo inicial + lançamentos desta conta</p></Card>
      <div className="grid gap-3 rounded-2xl border border-border-subtle bg-surface p-4 sm:grid-cols-[1fr_auto_auto] sm:items-end"><Field label="Conta de destino"><select className={inputClass} value={destinationId} onChange={(event) => { setDestinationId(event.target.value); setMessage(""); }}><option value="">Sem reclassificação</option>{state.accounts.filter(({ id }) => id !== account.id).map((destination) => <option key={destination.id} value={destination.id}>{destination.name}</option>)}</select></Field><Link className={buttonClass} href={`/dashboard/transactions/new?account=${account.id}`}>Novo lançamento</Link><ConfirmButton label="Excluir conta" title="Excluir esta conta?" description="Se houver vínculos, eles serão movidos para a conta de destino selecionada." onConfirm={remove} /></div>
      {message && <p role="alert" className="rounded-xl border border-expense/20 bg-expense-container p-3 text-sm text-expense">{message}</p>}
      <section className="space-y-3">
        <div className="flex items-end justify-between gap-4"><h2 className="text-lg font-bold">Extrato</h2><Field label="Período"><select className={inputClass} value={period} onChange={(event) => setPeriod(event.target.value)}><option value="all">Todas as datas</option><option value="2026-10">Outubro/2026</option><option value="2026-09">Setembro/2026</option></select></Field></div>
        {transactions.length ? <Card>{transactions.map((transaction) => <EntityRow key={transaction.id} title={transaction.description} subtitle={`${formatDate(transaction.date)} • ${transaction.category}`} value={formatMoney(transaction.amount)} valueTone={transaction.amount >= 0 ? "income" : "expense"} href={`/dashboard/transactions/${transaction.id}`} />)}</Card> : <EmptyState>Nenhum lançamento no período.</EmptyState>}
      </section>
    </div>
  );
}

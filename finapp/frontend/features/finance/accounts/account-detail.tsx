"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { accountBalance, formatDate, formatMoney } from "@/domain/finance/calculations";
import { useFinance } from "@/features/finance/model/finance-context";
import { Card } from "@/shared/ui/card";
import { ConfirmButton } from "@/shared/ui/confirm-button";
import { EntityRow } from "@/shared/ui/entity-row";
import { EmptyState, MissingEntity, Notice } from "@/shared/ui/feedback";
import { Field } from "@/shared/ui/field";
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
  const transactions = state.transactions.filter((item) => item.accountId === account.id && (period === "all" || item.date.startsWith(period))).sort((a, b) => b.date.localeCompare(a.date));
  const income = transactions.filter(({ amount }) => amount > 0).reduce((sum, item) => sum + item.amount, 0);
  const expenses = transactions.filter(({ amount }) => amount < 0).reduce((sum, item) => sum + item.amount, 0);
  const remove = () => {
    const hasTransactions = state.transactions.some((item) => item.accountId === account.id);
    const hasBills = state.bills.some((item) => item.accountId === account.id);
    if (hasTransactions || hasBills) {
      if (!destinationId) { setMessage(`Remova ${hasTransactions && hasBills ? "os lançamentos e as pendências" : hasTransactions ? "os lançamentos" : "as pendências"} ou selecione uma conta de destino antes de excluir esta conta.`); return; }
      dispatch({ type: "account/remove-and-reclassify", id: account.id, destinationId });
    } else dispatch({ type: "account/remove", id: account.id });
    router.push("/dashboard/accounts/deletion-success");
  };
  return <div className="space-y-7">
    <PageHeader title={account.name} eyebrow={`${account.bank} • ${account.type}`} action={<Link className={secondaryButtonClass} href={`/dashboard/accounts/${account.id}/edit`}>Editar</Link>} />
    <Card className="border-primary/15 bg-gradient-to-br from-primary-container to-surface"><p className="text-sm text-muted">Saldo em conta</p><p className="mt-3 text-4xl font-bold tracking-tight tabular-nums">{formatMoney(accountBalance(account, state.transactions))}</p><p className="mt-3 text-xs text-muted">Calculado localmente a partir do saldo inicial e lançamentos.</p><Link className={`${buttonClass} mt-6 w-full`} href={`/dashboard/transactions/new?account=${account.id}`}>Adicionar lançamento</Link></Card>
    <Card className="bg-surface-subtle/70"><Field label="Período consultado"><select className={inputClass} value={period} onChange={(event) => setPeriod(event.target.value)}><option value="all">Todas as datas</option><option value="2026-10">Outubro/2026</option><option value="2026-09">Setembro/2026</option></select></Field><div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-income/20 bg-surface p-4"><p className="text-xs font-bold uppercase tracking-wide text-income">Entradas</p><p className="mt-2 text-xl font-bold text-income">{formatMoney(income)}</p></div><div className="rounded-2xl border border-expense/20 bg-surface p-4"><p className="text-xs font-bold uppercase tracking-wide text-expense">Saídas</p><p className="mt-2 text-xl font-bold text-expense">{formatMoney(expenses)}</p></div></div><div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4 text-sm"><span>Resultado líquido do período</span><strong className={income + expenses >= 0 ? "text-income" : "text-expense"}>{formatMoney(income + expenses)}</strong></div></Card>
    <section className="space-y-3"><h2 className="text-xl font-bold">Histórico de Lançamentos</h2>{transactions.length ? <Card>{transactions.map((transaction) => <EntityRow key={transaction.id} title={transaction.description} subtitle={`${formatDate(transaction.date)} • ${transaction.category}`} value={formatMoney(transaction.amount)} valueTone={transaction.amount >= 0 ? "income" : "expense"} href={`/dashboard/transactions/${transaction.id}`} />)}</Card> : <EmptyState>Nenhum lançamento no período.</EmptyState>}</section>
    <Notice>Para excluir uma conta com vínculos, escolha outra conta. Os lançamentos e pendências serão preservados.</Notice>
    <div className="grid gap-3 rounded-2xl border border-expense/15 bg-surface p-4 sm:grid-cols-[1fr_auto] sm:items-end"><Field label="Conta de destino"><select className={inputClass} value={destinationId} onChange={(event) => { setDestinationId(event.target.value); setMessage(""); }}><option value="">Sem reclassificação</option>{state.accounts.filter(({ id }) => id !== account.id).map((destination) => <option key={destination.id} value={destination.id}>{destination.name}</option>)}</select></Field><ConfirmButton label="Excluir conta" title={`Excluir ${account.name}?`} description="Vínculos serão movidos para a conta de destino selecionada." onConfirm={remove} /></div>
    {message && <p role="alert" className="rounded-xl border border-expense/20 bg-expense-container p-3 text-sm text-expense">{message}</p>}
  </div>;
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { accountBalance, formatDate, formatMoney } from "@/domain/finance/calculations";
import { monthKey, monthLabel, shiftMonthKey } from "@/domain/finance/period";
import { useFinance } from "@/features/finance/model/finance-context";
import { Card } from "@/shared/ui/card";
import { ConfirmButton } from "@/shared/ui/confirm-button";
import { EntityRow } from "@/shared/ui/entity-row";
import { EmptyState, MissingEntity, Notice } from "@/shared/ui/feedback";
import { Field } from "@/shared/ui/field";
import { PageHeader } from "@/shared/ui/page-header";
import { buttonClass, inputClass, secondaryButtonClass } from "@/shared/ui/styles";

export function AccountDetail({ accountId }: { accountId: string }) {
  const { state, deleteAccount, remote } = useFinance();
  const router = useRouter();
  const [period, setPeriod] = useState("all");
  const [message, setMessage] = useState("");
  const account = state.accounts.find(({ id }) => id === accountId);
  if (!account) return <MissingEntity label="Conta" href="/dashboard/accounts" />;
  const currentMonth = monthKey();
  const previousMonth = shiftMonthKey(currentMonth, -1);
  const transactions = state.transactions.filter((item) => item.accountId === account.id && (period === "all" || item.date.startsWith(period))).sort((a, b) => b.date.localeCompare(a.date));
  const income = transactions.filter(({ amount }) => amount > 0).reduce((sum, item) => sum + item.amount, 0);
  const expenses = transactions.filter(({ amount }) => amount < 0).reduce((sum, item) => sum + item.amount, 0);
  const transactionGroups = Object.entries(transactions.reduce<Record<string, typeof transactions>>((groups, transaction) => {
    (groups[transaction.date] ??= []).push(transaction);
    return groups;
  }, {}));
  const remove = async () => {
    setMessage("");
    try { await deleteAccount(account.id); router.push("/dashboard/accounts/deletion-success"); }
    catch (reason) { setMessage(reason instanceof Error && "status" in reason && reason.status === 409 ? "Esta conta possui lançamentos ou pendências. Remova os vínculos antes de excluir." : reason instanceof Error ? reason.message : "Não foi possível excluir a conta."); }
  };
  return <div className="space-y-7">
    <PageHeader title={account.name} eyebrow={`${account.bank || "Sem instituição"} • ${account.type}`} action={<Link className={secondaryButtonClass} href={`/dashboard/accounts/${account.id}/edit`}>Editar</Link>} />
    <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-primary-container via-surface to-secondary-container/35"><p className="text-sm font-medium text-muted">Saldo em conta</p><p className="mt-3 text-4xl font-bold tracking-tight tabular-nums sm:text-5xl">{formatMoney(accountBalance(account, state.transactions))}</p><p className="mt-3 text-xs text-muted">Saldo inicial mais lançamentos confirmados.</p><Link className={`${buttonClass} mt-6 w-full sm:w-auto`} href={`/dashboard/transactions/new?account=${account.id}`}>Adicionar lançamento</Link></Card>
    <Card className="bg-surface-subtle/70"><Field label="Período consultado"><select className={inputClass} value={period} onChange={(event) => setPeriod(event.target.value)}><option value="all">Todas as datas</option><option value={currentMonth}>{monthLabel(currentMonth)}</option><option value={previousMonth}>{monthLabel(previousMonth)}</option></select></Field><div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-income/20 bg-surface p-4"><p className="text-xs font-bold uppercase tracking-wide text-income">Entradas</p><p className="mt-2 text-xl font-bold text-income">{formatMoney(income)}</p></div><div className="rounded-2xl border border-expense/20 bg-surface p-4"><p className="text-xs font-bold uppercase tracking-wide text-expense">Saídas</p><p className="mt-2 text-xl font-bold text-expense">{formatMoney(expenses)}</p></div></div><div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4 text-sm"><span>Resultado líquido do período</span><strong className={income + expenses >= 0 ? "text-income" : "text-expense"}>{formatMoney(income + expenses)}</strong></div></Card>
    <section className="space-y-4"><div className="flex items-center justify-between gap-3"><h2 className="text-xl font-bold">Histórico de Lançamentos</h2><span className="rounded-full bg-surface-strong px-3 py-1 text-xs font-bold text-muted">{transactions.length}</span></div>{transactions.length ? transactionGroups.map(([date, items]) => <div key={date} className="space-y-2"><div className="flex items-center justify-between px-1 text-xs text-muted"><h3 className="font-semibold text-foreground">{formatDate(date)}</h3><span>{formatMoney((items ?? []).reduce((sum, item) => sum + item.amount, 0))}</span></div><Card className="p-2 sm:p-3">{(items ?? []).map((transaction) => <EntityRow key={transaction.id} title={transaction.description} subtitle={transaction.category} value={formatMoney(transaction.amount)} valueTone={transaction.amount >= 0 ? "income" : "expense"} href={`/dashboard/transactions/${transaction.id}`} />)}</Card></div>) : <EmptyState>Nenhum lançamento no período.</EmptyState>}</section>
    <Notice>{remote ? "Edição e exclusão usam a API. Contas com vínculos não podem ser excluídas." : "Modo demo local. Contas com vínculos não podem ser excluídas."}</Notice>
    <div className="flex justify-end rounded-3xl border border-expense/15 bg-surface p-5"><ConfirmButton label="Excluir conta" title={`Excluir ${account.name}?`} description="A exclusão só será concluída se a conta não possuir lançamentos ou pendências." onConfirm={() => { void remove(); }} /></div>
    {message && <p role="alert" className="rounded-xl border border-expense/20 bg-expense-container p-3 text-sm text-expense">{message}</p>}
  </div>;
}

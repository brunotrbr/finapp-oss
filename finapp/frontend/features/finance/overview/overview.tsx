"use client";

import Link from "next/link";
import { accountBalance, formatDate, formatMoney, pendingTotal, totalBalance } from "@/domain/finance/calculations";
import { DEMO_MONTH } from "@/features/finance/model/demo-state";
import { useFinance } from "@/features/finance/model/finance-context";
import { Card } from "@/shared/ui/card";
import { EntityRow } from "@/shared/ui/entity-row";
import { Notice } from "@/shared/ui/feedback";
import { PageHeader } from "@/shared/ui/page-header";
import { buttonClass, secondaryButtonClass } from "@/shared/ui/styles";

export function Overview() {
  const { state } = useFinance();
  const total = totalBalance(state.accounts, state.transactions);
  const pending = pendingTotal(state.bills, DEMO_MONTH);
  return <div className="space-y-6">
    <PageHeader title={`Olá, ${state.displayName}`} eyebrow="Visão geral • Outubro de 2026 (demonstração)" />
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="border-0 bg-gradient-to-br from-on-primary-container to-primary text-on-primary shadow-xl shadow-primary/15 md:col-span-3"><p className="text-sm font-medium">Saldo total atual</p><p className="mt-2 text-4xl font-bold tracking-tight tabular-nums">{formatMoney(total)}</p><p className="mt-3 text-xs">Saldos iniciais + lançamentos cadastrados.</p></Card>
      <Card><p className="text-sm text-muted">Pendências do mês</p><p className="mt-2 text-2xl font-bold text-warning tabular-nums">{formatMoney(pending)}</p><Link href="/dashboard/bills" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary underline underline-offset-4">Ver pendências</Link></Card>
      <Card><p className="text-sm text-muted">Saldo livre estimado</p><p className="mt-2 text-2xl font-bold tabular-nums">{formatMoney(total - pending)}</p><p className="mt-3 text-xs text-muted">Total − pendências</p></Card>
      <Card><p className="text-sm text-muted">Contas</p><p className="mt-2 text-2xl font-bold text-secondary tabular-nums">{state.accounts.length}</p><Link href="/dashboard/accounts" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary underline underline-offset-4">Gerenciar</Link></Card>
    </div>
    <Notice>Projeção ilustrativa: não inclui receitas futuras nem faturas de cartão. Os dados ficam somente em memória e voltam ao exemplo ao recarregar.</Notice>
    <section className="space-y-3"><div className="flex items-center justify-between"><h2 className="text-lg font-bold">Minhas contas</h2><Link href="/dashboard/accounts/new" className={secondaryButtonClass}>Nova conta</Link></div><Card>{state.accounts.map((account) => <EntityRow key={account.id} title={account.name} subtitle={`${account.bank} • ${account.type}`} value={formatMoney(accountBalance(account, state.transactions))} href={`/dashboard/accounts/${account.id}`} />)}</Card></section>
    <section className="space-y-3"><h2 className="text-lg font-bold">Ações rápidas</h2><div className="flex flex-wrap gap-3"><Link href="/dashboard/transactions/new" className={buttonClass}>Novo lançamento</Link><Link href="/dashboard/bills/new" className={secondaryButtonClass}>Nova pendência</Link></div></section>
    <section className="space-y-3"><h2 className="text-lg font-bold">Últimos lançamentos</h2><Card>{[...state.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3).map((transaction) => <EntityRow key={transaction.id} title={transaction.description} subtitle={`${formatDate(transaction.date)} • ${transaction.category}`} value={formatMoney(transaction.amount)} valueTone={transaction.amount >= 0 ? "income" : "expense"} href={`/dashboard/transactions/${transaction.id}`} />)}</Card></section>
  </div>;
}

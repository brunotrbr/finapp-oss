"use client";

import Link from "next/link";
import { accountBalance, formatMoney, invoiceForCycle, pendingTotal, totalBalance } from "@/domain/finance/calculations";
import { DEMO_MONTH } from "@/features/finance/model/demo-state";
import { useFinance } from "@/features/finance/model/finance-context";
import { Card } from "@/shared/ui/card";
import { EntityRow } from "@/shared/ui/entity-row";
import { PageHeader } from "@/shared/ui/page-header";
import { buttonClass, secondaryButtonClass } from "@/shared/ui/styles";

export function Overview() {
  const { state } = useFinance();
  const total = totalBalance(state.accounts, state.transactions);
  const pending = pendingTotal(state.bills, DEMO_MONTH);
  return <div className="space-y-8">
    <PageHeader title="Minhas Contas" eyebrow={`Olá, ${state.displayName}`} description="Contas bancárias e compromissos de cartão em uma visão única." action={<Link href="/dashboard/accounts/new" className={buttonClass}>Nova Conta</Link>} />
    <Card className="overflow-hidden border-primary/15 bg-gradient-to-r from-primary-container via-surface to-secondary-container/45"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm text-muted">Saldo consolidado em contas</p><p className="mt-1 text-3xl font-bold text-on-primary-container tabular-nums">{formatMoney(total)}</p></div><span className="rounded-full bg-income-container px-3 py-1.5 text-xs font-bold text-income">Ativo</span></div></Card>
    <Card className="flex flex-wrap items-center justify-between gap-4 border-warning/20 bg-warning-container/35"><div><p className="text-sm text-warning">Pendências do mês</p><p className="mt-1 text-2xl font-bold tabular-nums">{formatMoney(pending)}</p></div><Link href="/dashboard/bills" className={secondaryButtonClass}>Ver pendências</Link></Card>
    <section className="space-y-3" aria-labelledby="bank-accounts-title"><div className="flex items-center justify-between gap-3"><h2 id="bank-accounts-title" className="text-xl font-bold">Contas Bancárias</h2><span className="rounded-full bg-surface-strong px-3 py-1 text-xs font-bold text-muted">{state.accounts.length}</span></div><div className="grid gap-4 md:grid-cols-2">{state.accounts.map((account) => <Card key={account.id} className="p-0"><Link href={`/dashboard/accounts/${account.id}`} className="block min-h-36 rounded-2xl p-5 transition hover:bg-primary-container/25"><div className="flex items-start justify-between gap-3"><div><p className="font-bold">{account.name}</p><p className="mt-1 text-xs text-muted">{account.bank} • {account.type}</p></div><span className="text-primary" aria-hidden>→</span></div><div className="mt-5 border-t border-border-subtle pt-4"><p className="text-xs text-muted">Saldo disponível</p><p className="mt-1 text-2xl font-bold tabular-nums">{formatMoney(accountBalance(account, state.transactions))}</p></div></Link></Card>)}</div></section>
    <section className="space-y-3" aria-labelledby="credit-cards-title"><div className="flex items-center justify-between gap-3"><h2 id="credit-cards-title" className="text-xl font-bold">Cartões de Crédito</h2><span className="text-xs text-muted">Faturas locais</span></div><div className="grid gap-4 md:grid-cols-2">{state.cards.map((card) => { const invoice = invoiceForCycle(card, state.purchases, DEMO_MONTH); return <Link key={card.id} href={`/dashboard/cards/${card.id}`} className="rounded-3xl bg-gradient-to-br from-secondary to-on-primary-container p-5 text-on-primary shadow-xl shadow-secondary/15 transition hover:-translate-y-0.5"><div className="flex items-center justify-between gap-3"><strong>{card.name}</strong><span aria-hidden>→</span></div><div className="mt-5 rounded-2xl bg-foreground/25 p-4"><p className="text-xs font-semibold uppercase tracking-wide">Fatura atual</p><p className="mt-2 text-3xl font-bold tabular-nums">{formatMoney(invoice.total)}</p><p className="mt-2 text-xs">Limite • fecha dia {card.closingDay}</p></div><p className="mt-4 text-xs">Vence dia {card.dueDay}</p></Link>; })}</div></section>
    <section className="flex flex-wrap gap-3"><Link href="/dashboard/transactions/new" className={buttonClass}>Novo Lançamento</Link><Link href="/dashboard/bills/new" className={secondaryButtonClass}>Nova pendência</Link></section>
    <section className="space-y-3"><h2 className="text-xl font-bold">Últimos lançamentos</h2><Card>{[...state.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3).map((transaction) => <EntityRow key={transaction.id} title={transaction.description} subtitle={transaction.category} value={formatMoney(transaction.amount)} valueTone={transaction.amount >= 0 ? "income" : "expense"} href={`/dashboard/transactions/${transaction.id}`} />)}</Card></section>
  </div>;
}

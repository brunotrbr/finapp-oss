"use client";

import Link from "next/link";
import { accountBalance, formatMoney, pendingBreakdown, pendingTotal, totalBalance } from "@/domain/finance/calculations";
import { useFinance } from "@/features/finance/model/finance-context";
import { LogoutButton } from "@/features/auth/logout-button";
import { Card } from "@/shared/ui/card";
import { EntityRow } from "@/shared/ui/entity-row";
import { EmptyState, Notice } from "@/shared/ui/feedback";
import { PageHeader } from "@/shared/ui/page-header";
import { buttonClass, secondaryButtonClass } from "@/shared/ui/styles";

const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

export function Overview() {
  const { state, status, error, errorStatus, retry, remote } = useFinance();
  if (status === "loading" || status === "idle") return <div role="status" aria-busy="true" className="animate-pulse space-y-5"><div className="h-8 w-48 rounded bg-surface-strong" /><div className="h-40 rounded-3xl bg-primary-container/60" /><div className="grid gap-4 sm:grid-cols-2"><div className="h-28 rounded-3xl bg-surface-strong" /><div className="h-28 rounded-3xl bg-surface-strong" /></div><span className="sr-only">Carregando dados financeiros…</span></div>;
  if (status === "error") return <Card className="text-center"><p className="text-sm font-semibold text-expense">Dados indisponíveis</p><h1 className="mt-2 text-2xl font-bold">Não foi possível carregar seu dashboard</h1><p className="mt-2 text-sm text-muted">{error}</p><div className="mt-6 flex justify-center">{errorStatus === 401 ? <LogoutButton label="Entrar novamente" /> : <button type="button" onClick={retry} className={buttonClass}>Tentar novamente</button>}</div></Card>;

  const month = currentMonth();
  const total = totalBalance(state.accounts, state.transactions);
  const pending = pendingTotal(state.bills, month);
  const overdue = pendingBreakdown(state.bills, month).overdue;
  const free = total - pending;

  return <div className="space-y-8">
    <PageHeader title="Visão geral" eyebrow={`Olá, ${state.displayName}`} description={`Resumo financeiro de ${new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(`${month}-01T12:00:00`))}.`} />

    <Card className="overflow-hidden border-primary/15 bg-gradient-to-r from-primary-container via-surface to-secondary-container/45"><p className="text-sm text-muted">Saldo total em contas</p><p className="mt-2 text-4xl font-bold text-on-primary-container tabular-nums">{formatMoney(total)}</p></Card>

    <section className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2" aria-label="Resumo do mês">
      <Card className="min-w-0 border-warning/20 bg-warning-container/35"><p className="text-sm font-semibold text-warning">Pendências abertas</p><p className="mt-2 text-2xl font-bold tabular-nums">{formatMoney(pending)}</p>{overdue > 0 && <p className="mt-1 text-xs font-semibold text-expense">{formatMoney(overdue)} vencidas</p>}<Link href="/dashboard/bills" className="mt-3 inline-flex text-sm font-bold text-warning">Ver pendências</Link></Card>
      <Card className="min-w-0 border-income/20 bg-income-container/35"><p className="text-sm font-semibold text-income">Saldo livre</p><p className="mt-2 text-2xl font-bold tabular-nums">{formatMoney(free)}</p><p className="mt-3 text-xs text-muted">Saldo total menos pendências do mês.</p></Card>
    </section>

    {!remote && <Notice>Modo demo local: use as operações normalmente; os dados reiniciam ao recarregar.</Notice>}

    <section className="space-y-3" aria-labelledby="accounts-title">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="accounts-title" className="text-xl font-bold">Minhas contas</h2><Link href="/dashboard/accounts/new" className={buttonClass}>Nova conta</Link></div>
      {state.accounts.length ? <Card>
        {state.accounts.map((account) => <EntityRow key={account.id} title={account.name} subtitle={`${account.bank || "Sem instituição"} • ${account.type}`} value={formatMoney(accountBalance(account, state.transactions))} href={`/dashboard/accounts/${account.id}`} />)}
      </Card> : <EmptyState>Nenhuma conta cadastrada.</EmptyState>}
    </section>

    <section className="space-y-3" aria-labelledby="quick-actions-title"><h2 id="quick-actions-title" className="text-xl font-bold">Ações rápidas</h2><div className="flex flex-wrap gap-3"><Link href="/dashboard/transactions/new" className={buttonClass}>Novo lançamento</Link><Link href="/dashboard/bills/new" className={secondaryButtonClass}>Nova pendência</Link></div></section>

    <section className="space-y-3" aria-labelledby="latest-title"><h2 id="latest-title" className="text-xl font-bold">Últimos lançamentos</h2>{state.transactions.length ? <Card>{[...state.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5).map((transaction) => <EntityRow key={transaction.id} title={transaction.description} subtitle={transaction.category} value={formatMoney(transaction.amount)} valueTone={transaction.amount >= 0 ? "income" : "expense"} href={`/dashboard/transactions/${transaction.id}`} />)}</Card> : <EmptyState>Nenhum lançamento encontrado.</EmptyState>}</section>
  </div>;
}

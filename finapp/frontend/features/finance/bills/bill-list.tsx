"use client";

import Link from "next/link";
import { formatDate, formatMoney, pendingBreakdown, pendingTotal } from "@/domain/finance/calculations";
import { monthKey, monthLabel } from "@/domain/finance/period";
import type { Bill } from "@/domain/finance/types";
import { useFinance } from "@/features/finance/model/finance-context";
import { Card } from "@/shared/ui/card";
import { EntityRow } from "@/shared/ui/entity-row";
import { EmptyState, Notice } from "@/shared/ui/feedback";
import { PageHeader } from "@/shared/ui/page-header";
import { buttonClass } from "@/shared/ui/styles";

function BillGroup({ title, items, tone = "warning" }: { title: string; items: Bill[]; tone?: "warning" | "income" }) {
  if (!items.length) return null;
  return <section className="space-y-3"><h2 className="text-lg font-bold">{title}</h2><Card>{items.map((bill) => <EntityRow key={bill.id} title={bill.description} subtitle={bill.status === "paid" ? `Paga em ${formatDate(bill.paidOn || "")}` : `Vence ${formatDate(bill.dueDate)}`} value={formatMoney(bill.amount)} valueTone={tone} href={`/dashboard/bills/${bill.id}`} />)}</Card></section>;
}

export function BillsList() {
  const { state, remote } = useFinance();
  const month = monthKey();
  const breakdown = pendingBreakdown(state.bills, month);
  const overdue = state.bills.filter((bill) => bill.status !== "paid" && bill.dueDate.slice(0, 7) < month);
  const current = state.bills.filter((bill) => bill.status !== "paid" && bill.dueDate.startsWith(month));
  const future = state.bills.filter((bill) => bill.status !== "paid" && bill.dueDate.slice(0, 7) > month);
  const paid = state.bills.filter((bill) => bill.status === "paid");
  return <div className="space-y-6"><PageHeader title="Pendências" eyebrow="Compromissos" action={<Link className={buttonClass} href="/dashboard/bills/new">Nova pendência</Link>} />{!remote && <Notice>Modo demo local: alterações são reiniciadas ao recarregar.</Notice>}<div className="grid gap-4 sm:grid-cols-2"><Card className="border-warning/15 bg-warning-container/45"><p className="text-sm font-medium text-warning">Total aberto até {monthLabel(month)}</p><p className="mt-2 text-3xl font-bold tabular-nums">{formatMoney(pendingTotal(state.bills, month))}</p></Card><Card className="border-expense/15 bg-expense-container/35"><p className="text-sm font-medium text-expense">Vencidas</p><p className="mt-2 text-3xl font-bold tabular-nums">{formatMoney(breakdown.overdue)}</p></Card></div>{state.bills.length ? <><BillGroup title="Vencidas" items={overdue} /><BillGroup title={`Abertas em ${monthLabel(month)}`} items={current} /><BillGroup title="Próximas" items={future} /><BillGroup title="Pagas" items={paid} tone="income" /></> : <EmptyState>Nenhuma pendência. Cadastre o primeiro compromisso para acompanhar vencimentos.</EmptyState>}</div>;
}

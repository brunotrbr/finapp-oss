"use client";

import Link from "next/link";
import { formatDate, formatMoney, pendingTotal } from "@/domain/finance/calculations";
import { DEMO_MONTH } from "@/features/finance/model/demo-state";
import { useFinance } from "@/features/finance/model/finance-context";
import { Card } from "@/shared/ui/card";
import { EntityRow } from "@/shared/ui/entity-row";
import { EmptyState, Notice } from "@/shared/ui/feedback";
import { PageHeader } from "@/shared/ui/page-header";
import { buttonClass } from "@/shared/ui/styles";

export function BillsList() {
  const { state } = useFinance();
  return <div className="space-y-6"><PageHeader title="Pendências" eyebrow="Compromissos" action={<Link className={buttonClass} href="/dashboard/bills/new">Nova pendência</Link>} /><Notice>Fluxo demonstrativo: marcar como paga cria um débito único na conta vinculada. Não há lembretes ou conciliação.</Notice><Card className="border-warning/15 bg-warning-container/45"><p className="text-sm font-medium text-warning">Pendentes em outubro/2026</p><p className="mt-2 text-3xl font-bold text-foreground tabular-nums">{formatMoney(pendingTotal(state.bills, DEMO_MONTH))}</p></Card>{state.bills.length ? <Card>{state.bills.map((bill) => <EntityRow key={bill.id} title={bill.description} subtitle={`Vence ${formatDate(bill.dueDate)}`} value={formatMoney(bill.amount)} valueTone="warning" href={`/dashboard/bills/${bill.id}`} />)}</Card> : <EmptyState>Nenhuma pendência.</EmptyState>}</div>;
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { formatDate, formatMoney, invoiceForCycle } from "@/domain/finance/calculations";
import { invoicePaymentError } from "@/domain/finance/finance-reducer";
import { DEMO_DATE, DEMO_MONTH } from "@/features/finance/model/demo-state";
import { useFinance } from "@/features/finance/model/finance-context";
import { Card } from "@/shared/ui/card";
import { ConfirmButton } from "@/shared/ui/confirm-button";
import { EntityRow } from "@/shared/ui/entity-row";
import { EmptyState, MissingEntity, Notice } from "@/shared/ui/feedback";
import { Field } from "@/shared/ui/field";
import { PageHeader } from "@/shared/ui/page-header";
import { buttonClass, inputClass } from "@/shared/ui/styles";

export function InvoiceScreen({ cardId }: { cardId: string }) {
  const { state, dispatch } = useFinance();
  const [accountId, setAccountId] = useState("");
  const [message, setMessage] = useState("");
  const card = state.cards.find(({ id }) => id === cardId);
  if (!card) return <MissingEntity label="Cartão" href="/dashboard/cards" />;
  const invoice = invoiceForCycle(card, state.purchases, DEMO_MONTH);
  const paid = state.invoicePayments.some((payment) => payment.cardId === card.id && payment.cycle === DEMO_MONTH);
  const pay = () => {
    if (!accountId) { setMessage("Selecione uma conta para pagar."); return; }
    const action = { type: "invoice/pay" as const, cardId: card.id, cycle: DEMO_MONTH, accountId, paidOn: DEMO_DATE };
    const rejection = invoicePaymentError(state, action);
    if (rejection) { setMessage(rejection); return; }
    dispatch(action); setMessage("Fatura paga. O débito foi registrado na conta selecionada.");
  };
  const success = message.startsWith("Fatura paga");

  return <div className="space-y-7"><PageHeader title={card.name} eyebrow="Detalhes do cartão" description={`Ciclo ${DEMO_MONTH}`} /><Card className="border-0 bg-gradient-to-br from-secondary to-on-primary-container text-on-primary shadow-xl shadow-secondary/15"><div className="flex items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-wider">Fatura atual</p><span className={`rounded-full px-3 py-1 text-xs font-bold ${paid ? "bg-income-container text-income" : "bg-warning-container text-warning"}`}>{paid ? "Paga" : "Aberta"}</span></div><p className="mt-5 text-4xl font-bold tabular-nums">{formatMoney(invoice.total)}</p><div className="mt-6 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-foreground/25 p-4 text-sm">Vencimento<br /><strong>{formatDate(invoice.dueDate)}</strong></div><div className="rounded-2xl bg-foreground/25 p-4 text-sm">Fechamento<br /><strong>{formatDate(invoice.closingDate)}</strong></div></div><Link href={`/dashboard/cards/${card.id}/purchases/new`} className={`${buttonClass} mt-5 w-full bg-primary-container text-on-primary-container hover:bg-surface`}>Adicionar compra</Link></Card><Notice>Pagamento demonstrativo local. Nenhuma operação bancária ou código de barras é gerado.</Notice>{message && <p role={success ? "status" : "alert"} className={`rounded-xl p-3 text-sm ${success ? "bg-income-container text-income" : "bg-expense-container text-expense"}`}>{message}</p>}<section className="space-y-3"><div className="flex items-center justify-between gap-3"><h2 className="text-xl font-bold">Lançamentos da fatura</h2><span className="rounded-full bg-primary-container px-3 py-1 text-xs font-bold text-primary">{invoice.items.length} itens</span></div>{invoice.items.length ? <Card>{invoice.items.map((item) => <EntityRow key={`${item.purchaseId}-${item.installment}`} title={item.description} subtitle={`Parcela ${item.installment} de ${item.installments}`} value={formatMoney(item.amount)} />)}</Card> : <EmptyState>Nenhum lançamento neste ciclo.</EmptyState>}</section>{invoice.total > 0 && <Card className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end"><Field label="Conta para pagamento"><select className={inputClass} value={accountId} onChange={(event) => { setAccountId(event.target.value); setMessage(""); }} disabled={paid}><option value="">Selecione</option>{state.accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></Field>{paid ? <button type="button" className="min-h-11 rounded-xl bg-income-container px-4 font-semibold text-income" disabled>Fatura paga</button> : <ConfirmButton label="Pagar fatura" title="Confirmar pagamento?" description="Um débito local será criado na conta selecionada." onConfirm={pay} danger={false} />}</Card>}</div>;
}

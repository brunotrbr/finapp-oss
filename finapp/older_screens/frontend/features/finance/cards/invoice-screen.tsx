"use client";

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
import { inputClass } from "@/shared/ui/styles";

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
    dispatch(action);
    setMessage("Fatura paga. O débito foi registrado na conta selecionada.");
  };
  return <div className="space-y-6"><PageHeader title={`Fatura • ${card.name}`} eyebrow={`Ciclo ${DEMO_MONTH}`} /><Card className="border-0 bg-gradient-to-br from-secondary to-on-primary-container text-on-primary"><p className="text-sm">Total da fatura</p><p className="mt-2 text-4xl font-bold">{formatMoney(invoice.total)}</p><p className="mt-3 text-xs">Fecha em {formatDate(invoice.closingDate)} • vence em {formatDate(invoice.dueDate)}</p></Card><Notice>Pagamento demonstrativo local. Nenhuma operação bancária ou código de barras é gerado.</Notice>{message && <p role={message.startsWith("Selecione") ? "alert" : "status"} className="rounded-xl bg-primary-container p-3 text-sm text-on-primary-container">{message}</p>}<section className="space-y-3"><h2 className="text-lg font-bold">Lançamentos da fatura</h2>{invoice.items.length ? <Card>{invoice.items.map((item) => <EntityRow key={`${item.purchaseId}-${item.installment}`} title={item.description} subtitle={`Parcela ${item.installment} de ${item.installments}`} value={formatMoney(item.amount)} />)}</Card> : <EmptyState>Nenhum lançamento neste ciclo.</EmptyState>}</section>{invoice.total > 0 && <Card className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end"><Field label="Conta para pagamento"><select className={inputClass} value={accountId} onChange={(event) => { setAccountId(event.target.value); setMessage(""); }} disabled={paid}><option value="">Selecione</option>{state.accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></Field>{paid ? <button type="button" className="min-h-11 rounded-xl bg-income-container px-4 font-semibold text-income" disabled>Fatura paga</button> : <ConfirmButton label="Pagar fatura" title="Confirmar pagamento?" description="Um débito será criado na conta selecionada e o ciclo não poderá ser pago novamente." onConfirm={pay} danger={false} />}</Card>}</div>;
}

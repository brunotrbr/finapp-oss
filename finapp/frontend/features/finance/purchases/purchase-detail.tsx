"use client";

import { useRouter } from "next/navigation";
import { formatDate, formatMoney } from "@/domain/finance/calculations";
import { useFinance } from "@/features/finance/model/finance-context";
import { Card } from "@/shared/ui/card";
import { ConfirmButton } from "@/shared/ui/confirm-button";
import { MissingEntity, Notice } from "@/shared/ui/feedback";
import { PageHeader } from "@/shared/ui/page-header";

export function PurchaseDetail({ purchaseId }: { purchaseId: string }) {
  const { state, dispatch, remote } = useFinance();
  const router = useRouter();
  const purchase = state.purchases.find(({ id }) => id === purchaseId);
  if (!purchase) return <MissingEntity label="Compra" href="/dashboard/cards" />;
  const card = state.cards.find(({ id }) => id === purchase.cardId);
  return <div className="space-y-6"><PageHeader title={purchase.description} eyebrow={card?.name || "Cartão indisponível"} /><Card><span className="inline-flex rounded-full bg-secondary-container px-3 py-1 text-xs font-semibold text-secondary">Compra</span><p className="mt-4 text-3xl font-bold tabular-nums">{formatMoney(purchase.amount)}</p><p className="mt-3 text-sm font-medium">{purchase.installments}x de {formatMoney(purchase.amount / purchase.installments)}</p><p className="mt-1 text-sm text-muted">Compra em {formatDate(purchase.date)}</p></Card><Notice>{remote ? "Exclusão indisponível até a API oferecer esse endpoint." : "A alocação de parcelas por fatura ainda não foi definida."}</Notice>{!remote && <ConfirmButton label="Excluir compra" title="Excluir esta compra?" onConfirm={() => { dispatch({ type: "purchase/remove", id: purchase.id }); router.push(card ? `/dashboard/cards/${card.id}` : "/dashboard/cards"); }} />}</div>;
}

"use client";

import { useRouter } from "next/navigation";
import { formatDate, formatMoney } from "@/domain/finance/calculations";
import { useFinance } from "@/features/finance/model/finance-context";
import { Card } from "@/shared/ui/card";
import { ConfirmButton } from "@/shared/ui/confirm-button";
import { MissingEntity, Notice } from "@/shared/ui/feedback";
import { PageHeader } from "@/shared/ui/page-header";

export function PurchaseDetail({ purchaseId }: { purchaseId: string }) {
  const { state, dispatch } = useFinance();
  const router = useRouter();
  const purchase = state.purchases.find(({ id }) => id === purchaseId);
  if (!purchase) return <MissingEntity label="Compra" href="/dashboard/cards" />;
  const card = state.cards.find(({ id }) => id === purchase.cardId);
  return <div className="space-y-6"><PageHeader title={purchase.description} eyebrow={card?.name || "Cartão indisponível"} /><Card><p className="text-3xl font-bold">{formatMoney(purchase.amount)}</p><p className="mt-3 text-sm">{purchase.installments}x de {formatMoney(purchase.amount / purchase.installments)}</p><p className="mt-1 text-sm text-zinc-500">Compra em {formatDate(purchase.date)}</p></Card><Notice>A alocação de parcelas por fatura ainda não foi definida.</Notice><ConfirmButton label="Excluir compra" title="Excluir esta compra?" onConfirm={() => { dispatch({ type: "purchase/remove", id: purchase.id }); router.push(card ? `/dashboard/cards/${card.id}` : "/dashboard/cards"); }} /></div>;
}

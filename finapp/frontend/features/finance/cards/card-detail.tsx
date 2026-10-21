"use client";

import Link from "next/link";
import { formatDate, formatMoney } from "@/domain/finance/calculations";
import { useFinance } from "@/features/finance/model/finance-context";
import { Card } from "@/shared/ui/card";
import { EntityRow } from "@/shared/ui/entity-row";
import { EmptyState, MissingEntity, Notice } from "@/shared/ui/feedback";
import { PageHeader } from "@/shared/ui/page-header";
import { buttonClass } from "@/shared/ui/styles";

export function CardDetail({ cardId }: { cardId: string }) {
  const { state } = useFinance();
  const card = state.cards.find(({ id }) => id === cardId);
  if (!card) return <MissingEntity label="Cartão" href="/dashboard/cards" />;
  const purchases = state.purchases.filter((purchase) => purchase.cardId === card.id);
  return <div className="space-y-6"><PageHeader title={card.name} eyebrow={`Fecha dia ${card.closingDay} • vence dia ${card.dueDay}`} action={<Link href={`/dashboard/cards/${card.id}/purchases/new`} className={buttonClass}>Nova compra</Link>} /><Card className="border-0 bg-gradient-to-br from-secondary to-on-primary-container text-on-primary shadow-xl shadow-secondary/15"><p className="text-sm font-medium">Limite cadastrado</p><p className="mt-2 text-4xl font-bold tracking-tight tabular-nums">{formatMoney(card.limit)}</p><div className="mt-5 flex gap-4 border-t border-white/15 pt-4 text-xs"><span>Fechamento: dia {card.closingDay}</span><span>Vencimento: dia {card.dueDay}</span></div></Card><Notice>Compras e parcelas são ilustrativas. Nenhuma fatura ou entidade derivada é criada.</Notice><section className="space-y-3"><h2 className="text-lg font-bold">Compras</h2>{purchases.length ? <Card>{purchases.map((purchase) => <EntityRow key={purchase.id} title={purchase.description} subtitle={`${purchase.installments}x • ${formatDate(purchase.date)}`} value={formatMoney(purchase.amount)} href={`/dashboard/purchases/${purchase.id}`} />)}</Card> : <EmptyState>Nenhuma compra neste cartão.</EmptyState>}</section></div>;
}

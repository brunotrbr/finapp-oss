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
  return <div className="space-y-6"><PageHeader title={card.name} eyebrow={`Fecha dia ${card.closingDay} • vence dia ${card.dueDay}`} action={<Link href={`/dashboard/cards/${card.id}/purchases/new`} className={buttonClass}>Nova compra</Link>} /><Card className="bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"><p className="text-sm opacity-70">Limite cadastrado</p><p className="mt-2 text-3xl font-bold">{formatMoney(card.limit)}</p></Card><Notice>Compras e parcelas são ilustrativas. Nenhuma fatura ou entidade derivada é criada.</Notice><section className="space-y-3"><h2 className="text-lg font-bold">Compras</h2>{purchases.length ? <Card>{purchases.map((purchase) => <EntityRow key={purchase.id} title={purchase.description} subtitle={`${purchase.installments}x • ${formatDate(purchase.date)}`} value={formatMoney(purchase.amount)} href={`/dashboard/purchases/${purchase.id}`} />)}</Card> : <EmptyState>Nenhuma compra neste cartão.</EmptyState>}</section></div>;
}

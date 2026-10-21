"use client";

import Link from "next/link";
import { formatMoney } from "@/domain/finance/calculations";
import { useFinance } from "@/features/finance/model/finance-context";
import { Card } from "@/shared/ui/card";
import { EntityRow } from "@/shared/ui/entity-row";
import { EmptyState } from "@/shared/ui/feedback";
import { PageHeader } from "@/shared/ui/page-header";
import { buttonClass } from "@/shared/ui/styles";

export function CardsList() {
  const { state } = useFinance();
  return <div className="space-y-6"><PageHeader title="Cartões" action={<Link href="/dashboard/cards/new" className={buttonClass}>Novo cartão</Link>} />{state.cards.length ? <Card>{state.cards.map((card) => <EntityRow key={card.id} title={card.name} subtitle={`Fecha dia ${card.closingDay} • vence dia ${card.dueDay}`} value={`Limite ${formatMoney(card.limit)}`} href={`/dashboard/cards/${card.id}`} />)}</Card> : <EmptyState>Nenhum cartão cadastrado.</EmptyState>}</div>;
}

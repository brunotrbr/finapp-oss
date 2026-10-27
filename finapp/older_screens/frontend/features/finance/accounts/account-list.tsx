"use client";

import Link from "next/link";
import { accountBalance, formatMoney } from "@/domain/finance/calculations";
import { useFinance } from "@/features/finance/model/finance-context";
import { Card } from "@/shared/ui/card";
import { EntityRow } from "@/shared/ui/entity-row";
import { EmptyState } from "@/shared/ui/feedback";
import { PageHeader } from "@/shared/ui/page-header";
import { buttonClass } from "@/shared/ui/styles";

export function AccountsList() {
  const { state } = useFinance();

  return (
    <div className="space-y-6">
      <PageHeader title="Contas" eyebrow="Patrimônio" description="Acompanhe saldos e abra o extrato de cada conta." action={<Link className={buttonClass} href="/dashboard/accounts/new">Nova conta</Link>} />
      {state.accounts.length ? (
        <Card>
          {state.accounts.map((account) => (
            <EntityRow
              key={account.id}
              title={account.name}
              subtitle={`${account.bank} • ${account.type}`}
              value={formatMoney(accountBalance(account, state.transactions))}
              href={`/dashboard/accounts/${account.id}`}
            />
          ))}
        </Card>
      ) : <EmptyState>Nenhuma conta cadastrada.</EmptyState>}
    </div>
  );
}

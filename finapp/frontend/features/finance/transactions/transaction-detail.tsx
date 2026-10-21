"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDate, formatMoney } from "@/domain/finance/calculations";
import { useFinance } from "@/features/finance/model/finance-context";
import { Card } from "@/shared/ui/card";
import { ConfirmButton } from "@/shared/ui/confirm-button";
import { MissingEntity } from "@/shared/ui/feedback";
import { PageHeader } from "@/shared/ui/page-header";
import { buttonClass } from "@/shared/ui/styles";

export function TransactionDetail({ transactionId }: { transactionId: string }) {
  const { state, dispatch } = useFinance();
  const router = useRouter();
  const transaction = state.transactions.find(({ id }) => id === transactionId);
  if (!transaction) return <MissingEntity label="Lançamento" href="/dashboard/accounts" />;
  const account = state.accounts.find(({ id }) => id === transaction.accountId);

  return <div className="space-y-6"><PageHeader title={transaction.description} eyebrow={transaction.amount >= 0 ? "Entrada" : "Saída"} /><Card><p className="text-3xl font-bold">{formatMoney(transaction.amount)}</p><dl className="mt-5 grid gap-3 text-sm"><div><dt className="text-zinc-500">Data</dt><dd>{formatDate(transaction.date)}</dd></div><div><dt className="text-zinc-500">Conta</dt><dd>{account?.name || "Conta removida"}</dd></div><div><dt className="text-zinc-500">Categoria</dt><dd>{transaction.category}</dd></div><div><dt className="text-zinc-500">Observações</dt><dd>{transaction.note || "—"}</dd></div></dl></Card><div className="flex gap-3"><Link className={buttonClass} href={`/dashboard/transactions/${transaction.id}/edit`}>Editar</Link><ConfirmButton label="Remover" title="Remover lançamento?" description="O saldo da conta será atualizado imediatamente." onConfirm={() => { dispatch({ type: "transaction/remove", id: transaction.id }); router.push(account ? `/dashboard/accounts/${account.id}` : "/dashboard/accounts"); }} /></div></div>;
}

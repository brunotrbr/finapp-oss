"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatDate, formatMoney } from "@/domain/finance/calculations";
import { useFinance } from "@/features/finance/model/finance-context";
import { Card } from "@/shared/ui/card";
import { ConfirmButton } from "@/shared/ui/confirm-button";
import { MissingEntity } from "@/shared/ui/feedback";
import { PageHeader } from "@/shared/ui/page-header";
import { buttonClass } from "@/shared/ui/styles";

export function TransactionDetail({ transactionId }: { transactionId: string }) {
  const { state, deleteTransaction } = useFinance();
  const router = useRouter();
  const [error, setError] = useState("");
  const transaction = state.transactions.find(({ id }) => id === transactionId);
  if (!transaction) return <MissingEntity label="Lançamento" href="/dashboard/accounts" />;
  const account = state.accounts.find(({ id }) => id === transaction.accountId);
  const remove = async () => {
    setError("");
    try { await deleteTransaction(transaction.id); router.push(account ? `/dashboard/accounts/${account.id}` : "/dashboard/accounts"); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível remover o lançamento."); }
  };
  const positive = transaction.amount >= 0;
  return <div className="space-y-6"><PageHeader title={transaction.description} eyebrow={positive ? "Entrada" : "Saída"} /><Card className={positive ? "border-income/20" : "border-expense/20"}><span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${positive ? "bg-income-container text-income" : "bg-expense-container text-expense"}`}>{positive ? "Receita" : "Despesa"}</span><p className={`mt-4 text-3xl font-bold tabular-nums ${positive ? "text-income" : "text-expense"}`}>{formatMoney(transaction.amount)}</p><dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-muted">Data</dt><dd className="font-medium">{formatDate(transaction.date)}</dd></div><div><dt className="text-muted">Conta</dt><dd className="font-medium">{account?.name || "Conta removida"}</dd></div><div><dt className="text-muted">Categoria</dt><dd className="font-medium">{transaction.category}</dd></div><div><dt className="text-muted">Observações</dt><dd className="font-medium">{transaction.note || "—"}</dd></div></dl></Card>{error && <p role="alert" className="rounded-xl bg-expense-container p-3 text-sm text-expense">{error}</p>}<div className="flex flex-wrap gap-3"><Link className={buttonClass} href={`/dashboard/transactions/${transaction.id}/edit`}>Editar</Link><ConfirmButton label="Remover" title="Remover lançamento?" description="O saldo será atualizado após a confirmação." onConfirm={() => { void remove(); }} /></div></div>;
}

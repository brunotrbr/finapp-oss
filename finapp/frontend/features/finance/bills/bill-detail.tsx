"use client";

import { useRouter } from "next/navigation";
import { formatDate, formatMoney } from "@/domain/finance/calculations";
import { DEMO_DATE } from "@/features/finance/model/demo-state";
import { useFinance } from "@/features/finance/model/finance-context";
import { Card } from "@/shared/ui/card";
import { ConfirmButton } from "@/shared/ui/confirm-button";
import { MissingEntity } from "@/shared/ui/feedback";
import { PageHeader } from "@/shared/ui/page-header";

export function BillDetail({ billId }: { billId: string }) {
  const { state, dispatch } = useFinance();
  const router = useRouter();
  const bill = state.bills.find(({ id }) => id === billId);
  if (!bill) return <MissingEntity label="Pendência" href="/dashboard/bills" />;
  const account = state.accounts.find(({ id }) => id === bill.accountId);

  return <div className="space-y-6"><PageHeader title={bill.description} eyebrow="Pendência demonstrativa" /><Card><p className="text-3xl font-bold">{formatMoney(bill.amount)}</p><p className="mt-3 text-sm text-zinc-500">Vencimento: {formatDate(bill.dueDate)} • Conta: {account?.name || "indisponível"}</p></Card><div className="flex flex-wrap gap-3"><ConfirmButton danger={false} label="Marcar paga" title="Registrar pagamento?" description="Será criado exatamente um débito na conta vinculada e a pendência será removida." onConfirm={() => { dispatch({ type: "bill/pay", id: bill.id, paidOn: DEMO_DATE }); router.push("/dashboard"); }} /><ConfirmButton label="Remover" title="Remover pendência?" onConfirm={() => { dispatch({ type: "bill/remove", id: bill.id }); router.push("/dashboard/bills"); }} /></div></div>;
}

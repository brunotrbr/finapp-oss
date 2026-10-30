"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { formatDate, formatMoney } from "@/domain/finance/calculations";
import { useFinance } from "@/features/finance/model/finance-context";
import { fieldErrorFor } from "@/features/finance/model/api-errors";
import { submissionFor, type PendingSubmission } from "@/features/finance/model/submission";
import { Card } from "@/shared/ui/card";
import { ConfirmButton } from "@/shared/ui/confirm-button";
import { Field } from "@/shared/ui/field";
import { MissingEntity } from "@/shared/ui/feedback";
import { PageHeader } from "@/shared/ui/page-header";
import { buttonClass, inputClass } from "@/shared/ui/styles";

export function BillDetail({ billId }: { billId: string }) {
  const { state, deleteBill, payBill } = useFinance();
  const router = useRouter();
  const bill = state.bills.find(({ id }) => id === billId);
  const [paymentAccount, setPaymentAccount] = useState<{ billId: string; accountId: string } | null>(null);
  const accountId = paymentAccount?.billId === billId ? paymentAccount.accountId : bill?.accountId || "";
  const [paidOn, setPaidOn] = useState(new Date().toISOString().slice(0, 10));
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const paymentSubmission = useRef<PendingSubmission | null>(null);
  if (!bill) return <MissingEntity label="Pendência" href="/dashboard/bills" />;
  const account = state.accounts.find(({ id }) => id === bill.accountId);
  const paid = bill.status === "paid";
  const pay = async () => {
    if (!accountId || !paidOn) { setSuccess(false); setMessage("Selecione a conta e a data do pagamento."); return; }
    const next = { billId: bill.id, accountId, paidOn };
    paymentSubmission.current = submissionFor(paymentSubmission.current, next);
    setSubmitting(true);
    try { await payBill(bill.id, accountId, paidOn, paymentSubmission.current.key); paymentSubmission.current = null; setSuccess(true); setMessage("Pagamento registrado. A pendência permanece no histórico."); }
    catch (reason) {
      const fieldError = fieldErrorFor(reason, { accountId: "accountId", paidOn: "paidOn" });
      setSuccess(false); setMessage(fieldError?.message || (reason instanceof Error ? reason.message : "Não foi possível registrar o pagamento."));
    } finally { setSubmitting(false); }
  };
  const remove = async () => {
    try { await deleteBill(bill.id); router.push("/dashboard/bills"); }
    catch (reason) { setSuccess(false); setMessage(reason instanceof Error ? reason.message : "Não foi possível remover a pendência."); }
  };
  const statusLabel = paid ? "Paga" : bill.dueDate < new Date().toISOString().slice(0, 10) ? "Vencida" : "Aberta";
  return <div className="space-y-6"><PageHeader title={bill.description} eyebrow="Pendência" action={!paid ? <Link className={buttonClass} href={`/dashboard/bills/${bill.id}/edit`}>Editar</Link> : undefined} /><Card className={paid ? "border-income/20" : "border-warning/20"}><span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${paid ? "bg-income-container text-income" : "bg-warning-container text-warning"}`}>{statusLabel}</span><p className="mt-4 text-3xl font-bold tabular-nums">{formatMoney(bill.amount)}</p><p className="mt-3 text-sm text-muted">Vencimento: {formatDate(bill.dueDate)} • Conta: {account?.name || "indisponível"}</p>{paid && <p className="mt-2 text-sm text-income">Paga em {formatDate(bill.paidOn || "")}</p>}</Card>{message && <p role={success ? "status" : "alert"} className={`rounded-xl p-3 text-sm ${success ? "bg-income-container text-income" : "bg-expense-container text-expense"}`}>{message}</p>}{!paid && <><Card className="grid gap-4 sm:grid-cols-2"><Field label="Conta para pagamento"><select className={inputClass} value={accountId} onChange={(event) => setPaymentAccount({ billId, accountId: event.target.value })} disabled={submitting}>{state.accounts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="Data do pagamento"><input className={inputClass} type="date" value={paidOn} onChange={(event) => setPaidOn(event.target.value)} disabled={submitting} /></Field></Card><div className="flex flex-wrap gap-3"><ConfirmButton danger={false} label={submitting ? "Registrando…" : "Marcar paga"} title="Registrar pagamento?" description="Será criado exatamente um débito na conta selecionada e a pendência permanecerá no histórico." onConfirm={() => { void pay(); }} disabled={submitting} /><ConfirmButton label="Remover" title="Remover pendência?" onConfirm={() => { void remove(); }} disabled={submitting} /></div></>}</div>;
}

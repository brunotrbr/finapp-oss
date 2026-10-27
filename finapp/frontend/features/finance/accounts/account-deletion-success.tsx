"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AccountDeletionResult } from "@/domain/finance/types";
import { formatMoney } from "@/domain/finance/calculations";
import { useFinance } from "@/features/finance/model/finance-context";
import { Card } from "@/shared/ui/card";
import { buttonClass, secondaryButtonClass } from "@/shared/ui/styles";

export function AccountDeletionSuccess() {
  const { state, dispatch } = useFinance();
  const [result] = useState<AccountDeletionResult | undefined>(() => state.accountDeletionResult);

  useEffect(() => {
    if (state.accountDeletionResult) dispatch({ type: "account/deletion-result-consume" });
  }, [dispatch, state.accountDeletionResult]);

  if (!result) {
    return <Card className="mx-auto max-w-xl text-center"><h1 className="text-2xl font-bold">Nenhuma exclusão recente</h1><p className="mt-2 text-sm leading-6 text-muted">Este endereço não confirma uma operação por si só. Exclua uma conta para ver o resultado aqui.</p><Link href="/dashboard/accounts" className={`${buttonClass} mt-6`}>Ver contas</Link></Card>;
  }

  return <Card className="mx-auto max-w-xl text-center"><div className="mx-auto grid size-14 place-items-center rounded-full bg-income-container text-2xl text-income" aria-hidden>✓</div><h1 className="mt-5 text-2xl font-bold">Conta excluída</h1><p className="mt-2 text-sm leading-6 text-muted">{result.reclassified ? `Os vínculos de ${result.accountName} foram reclassificados para ${result.destinationName}.` : `${result.accountName} foi excluída. Não havia vínculos para reclassificar.`}</p>{result.reclassified && <dl className="mt-6 grid grid-cols-3 gap-2 rounded-2xl bg-surface-subtle p-4 text-left"><div><dt className="text-xs text-muted">Lançamentos</dt><dd className="mt-1 font-bold">{result.transactionCount ?? 0}</dd></div><div><dt className="text-xs text-muted">Pendências</dt><dd className="mt-1 font-bold">{result.billCount ?? 0}</dd></div><div><dt className="text-xs text-muted">Saldo integrado</dt><dd className="mt-1 font-bold">{formatMoney(result.transferredInitialBalance ?? 0)}</dd></div></dl>}<div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/dashboard/accounts" className={buttonClass}>Ver contas</Link><Link href="/dashboard" className={secondaryButtonClass}>Voltar ao início</Link></div></Card>;
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AccountDeletionResult } from "@/domain/finance/types";
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

  return <Card className="mx-auto max-w-xl text-center"><div className="mx-auto grid size-14 place-items-center rounded-full bg-income-container text-2xl text-income" aria-hidden>✓</div><h1 className="mt-5 text-2xl font-bold">Conta excluída</h1><p className="mt-2 text-sm leading-6 text-muted">{result.reclassified ? `Os vínculos de ${result.accountName} foram reclassificados para ${result.destinationName}.` : `${result.accountName} foi excluída. Não havia vínculos para reclassificar.`}</p><div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/dashboard/accounts" className={buttonClass}>Ver contas</Link><Link href="/dashboard" className={secondaryButtonClass}>Voltar ao início</Link></div></Card>;
}

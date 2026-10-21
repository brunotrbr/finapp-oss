"use client";

import { useEffect } from "react";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <div className="rounded-2xl border border-red-200 bg-white p-8 text-center dark:border-red-900 dark:bg-zinc-950"><p className="text-sm font-semibold text-red-600">Erro inesperado</p><h1 className="mt-2 text-2xl font-bold">Não foi possível abrir esta tela</h1><p className="mt-2 text-sm text-zinc-500">Nenhum dado sensível foi exibido. Tente novamente.</p><button type="button" onClick={reset} className="mt-6 min-h-11 rounded-xl bg-zinc-950 px-5 font-semibold text-white dark:bg-white dark:text-black">Tentar novamente</button></div>;
}

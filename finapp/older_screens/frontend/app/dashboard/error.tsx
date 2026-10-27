"use client";

import { useEffect } from "react";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <div className="rounded-2xl border border-expense/20 bg-surface p-8 text-center shadow-sm"><p className="text-sm font-semibold text-expense">Erro inesperado</p><h1 className="mt-2 text-2xl font-bold">Não foi possível abrir esta tela</h1><p className="mt-2 text-sm text-muted">Nenhum dado sensível foi exibido. Tente novamente.</p><button type="button" onClick={reset} className="mt-6 min-h-11 rounded-xl bg-primary px-5 font-semibold text-on-primary transition hover:bg-primary-hover">Tentar novamente</button></div>;
}

import { Card } from "@/shared/ui/card";
import { PageHeader } from "@/shared/ui/page-header";

export function AboutSettings() {
  return <div className="space-y-6"><PageHeader title="Sobre" /><Card><h2 className="font-bold">Finapp Finances</h2><p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Demonstração frontend de contas, lançamentos, categorias, pendências e cartões. Os dados financeiros são fictícios e não são enviados a uma API nem persistidos.</p></Card></div>;
}

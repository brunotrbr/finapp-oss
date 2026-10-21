import { Card } from "@/shared/ui/card";
import { PageHeader } from "@/shared/ui/page-header";

export function AboutSettings() {
  return <div className="space-y-6"><PageHeader title="Sobre" eyebrow="Open source" /><Card><span className="inline-flex rounded-full bg-primary-container px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">OSS</span><h2 className="mt-4 font-bold">Finapp Finances</h2><p className="mt-2 text-sm leading-6 text-muted">Demonstração frontend de contas, lançamentos, categorias, pendências e cartões. Os dados financeiros são fictícios e não são enviados a uma API nem persistidos.</p></Card></div>;
}

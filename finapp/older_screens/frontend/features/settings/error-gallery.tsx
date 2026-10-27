import Link from "next/link";
import { Card } from "@/shared/ui/card";
import { PageHeader } from "@/shared/ui/page-header";
import { buttonClass } from "@/shared/ui/styles";

const errors: Record<string, [string, string]> = {
  "401": ["Sessão expirada", "Faça login novamente."],
  "403": ["Acesso negado", "Você não tem permissão para acessar este conteúdo."],
  "404": ["Página não encontrada", "Este endereço não existe."],
  "500": ["Algo deu errado", "Tente novamente mais tarde."],
  offline: ["Sem conexão", "Verifique sua conexão. Recursos de rede podem ficar indisponíveis."],
  empty: ["Nenhum resultado", "Ainda não há itens aqui."],
};

export function ErrorGallery({ code }: { code: string }) {
  const current = errors[code] || errors["404"];
  return <div className="space-y-6"><PageHeader title="Estados do sistema" eyebrow="Galeria demonstrativa — não é uma resposta real do servidor" /><nav aria-label="Estados demonstrativos" className="flex flex-wrap gap-2">{Object.keys(errors).map((item) => <Link key={item} href={`/dashboard/settings/errors/${item}`} aria-current={item === code ? "page" : undefined} className={`min-h-11 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${item === code ? "border-primary bg-primary text-on-primary" : "border-border bg-surface text-muted hover:border-primary/40 hover:text-primary"}`}>{item}</Link>)}</nav><Card className="py-12 text-center"><p className="text-5xl font-black text-muted">{code === "empty" ? "∅" : code}</p><h2 className="mt-4 text-xl font-bold">{current[0]}</h2><p className="mt-2 text-sm text-muted">{current[1]}</p><Link className={`${buttonClass} mt-6`} href="/dashboard">Voltar ao início</Link></Card></div>;
}

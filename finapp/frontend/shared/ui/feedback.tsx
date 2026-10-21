import Link from "next/link";

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-border bg-surface px-5 py-10 text-center text-sm text-muted">{children}</div>;
}

export function Notice({ children }: { children: React.ReactNode }) {
  return <aside className="rounded-xl border border-primary/15 bg-primary-container/45 p-4 text-sm text-on-primary-container">{children}</aside>;
}

export function MissingEntity({ label, href }: { label: string; href: string }) {
  return <EmptyState>{label} não encontrado ou removido nesta sessão. <Link className="font-semibold text-primary underline underline-offset-4" href={href}>Voltar à lista</Link></EmptyState>;
}

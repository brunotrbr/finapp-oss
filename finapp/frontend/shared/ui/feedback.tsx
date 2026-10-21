import Link from "next/link";

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-zinc-300 px-5 py-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">{children}</div>;
}

export function Notice({ children }: { children: React.ReactNode }) {
  return <aside className="rounded-xl border border-zinc-200 bg-zinc-100 p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">{children}</aside>;
}

export function MissingEntity({ label, href }: { label: string; href: string }) {
  return <EmptyState>{label} não encontrado ou removido nesta sessão. <Link className="font-semibold underline" href={href}>Voltar à lista</Link></EmptyState>;
}

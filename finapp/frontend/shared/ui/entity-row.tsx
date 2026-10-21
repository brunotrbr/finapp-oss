import Link from "next/link";

export function EntityRow({ title, subtitle, value, href }: { title: string; subtitle?: string; value?: string; href: string }) {
  return <Link href={href} className="flex min-h-14 items-center justify-between gap-4 border-b border-zinc-100 py-3 last:border-0 hover:text-zinc-600 dark:border-zinc-800 dark:hover:text-zinc-300"><span><strong className="block text-sm">{title}</strong>{subtitle && <span className="text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</span>}</span><span className="flex items-center gap-2 text-right text-sm font-semibold">{value}<span aria-hidden>→</span></span></Link>;
}

import Link from "next/link";

export function EntityRow({ title, subtitle, value, href, valueTone = "neutral" }: { title: string; subtitle?: string; value?: string; href: string; valueTone?: "neutral" | "income" | "expense" | "warning" }) {
  const tone = { neutral: "text-foreground", income: "text-income", expense: "text-expense", warning: "text-warning" }[valueTone];
  return <Link href={href} className="group flex min-h-16 items-center justify-between gap-4 border-b border-border-subtle py-3 last:border-0 hover:text-primary"><span className="min-w-0"><strong className="block truncate text-sm font-semibold">{title}</strong>{subtitle && <span className="mt-0.5 block truncate text-xs text-muted">{subtitle}</span>}</span><span className={`flex shrink-0 items-center gap-2 text-right text-sm font-semibold tabular-nums ${tone}`}>{value}<span aria-hidden className="text-primary transition-transform group-hover:translate-x-0.5">→</span></span></Link>;
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { href: "/dashboard", label: "Início", icon: "⌂" },
  { href: "/dashboard/accounts", label: "Contas", icon: "▤" },
  { href: "/dashboard/bills", label: "Pendências", icon: "◷" },
  { href: "/dashboard/cards", label: "Cartões", icon: "▣" },
  { href: "/dashboard/settings", label: "Ajustes", icon: "⚙" },
];

export function DashboardShell({ children, user }: { children: React.ReactNode; user: { email: string | null; displayName: string | null; photoURL: string | null } }) {
  const pathname = usePathname();
  const active = (href: string) => href === "/dashboard" ? pathname === href : pathname.startsWith(href);
  return <div className="min-h-dvh bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between px-4 sm:px-6"><Link href="/dashboard" className="font-bold tracking-tight">Finapp Finances</Link><div className="min-w-0 text-right"><p className="truncate text-sm font-medium">{user.displayName || "Minha conta"}</p><p className="truncate text-xs text-zinc-500">{user.email}</p></div></div>
    </header>
    <div className="mx-auto flex max-w-6xl gap-8 px-4 pb-24 pt-6 sm:px-6 lg:pb-10">
      <nav aria-label="Navegação principal" className="sticky top-24 hidden h-fit w-48 shrink-0 space-y-1 lg:block">{navigation.map((item) => <Link key={item.href} href={item.href} aria-current={active(item.href) ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium ${active(item.href) ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950" : "hover:bg-zinc-200 dark:hover:bg-zinc-900"}`}><span aria-hidden>{item.icon}</span>{item.label}</Link>)}</nav>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
    <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-zinc-200 bg-white px-1 pb-[env(safe-area-inset-bottom)] dark:border-zinc-800 dark:bg-zinc-950 lg:hidden">{navigation.map((item) => <Link key={item.href} href={item.href} aria-current={active(item.href) ? "page" : undefined} className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium ${active(item.href) ? "text-zinc-950 dark:text-white" : "text-zinc-500"}`}><span aria-hidden className="text-lg">{item.icon}</span>{item.label}</Link>)}</nav>
  </div>;
}

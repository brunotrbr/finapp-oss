"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogoutButton } from "@/features/auth/logout-button";
import { Icon } from "@/shared/ui/icon";

const navigation = [
  { href: "/dashboard", label: "Início", icon: "home" as const },
  { href: "/dashboard/accounts", label: "Contas", icon: "accounts" as const },
  { href: "/dashboard/bills", label: "Pendências", icon: "pending" as const },
  { href: "/dashboard/cards", label: "Cartões", icon: "cards" as const },
  { href: "/dashboard/settings", label: "Ajustes", icon: "settings" as const },
];

const mobileNavigation = navigation;

type ShellUser = {
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

function UserMenu({ user }: { user: ShellUser }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const initial = (user.displayName || user.email || "F").trim().charAt(0).toLocaleUpperCase("pt-BR");

  useEffect(() => {
    if (!open) return;

    function closeOnOutsidePointer(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative flex min-w-0 items-center gap-3">
      <div className="hidden min-w-0 text-right sm:block">
        <p className="truncate text-sm font-semibold">{user.displayName || "Minha conta"}</p>
        <p className="truncate text-xs text-muted">{user.email}</p>
      </div>
      <button
        ref={triggerRef}
        type="button"
        aria-label={open ? "Fechar menu do usuário" : "Abrir menu do usuário"}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="user-menu"
        onClick={() => setOpen((current) => !current)}
        className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary-container text-sm font-bold text-secondary transition hover:bg-surface-strong"
      >
        <span aria-hidden>{initial}</span>
      </button>
      {open && (
        <div
          id="user-menu"
          role="menu"
          aria-label="Menu do usuário"
          className="absolute right-0 top-full mt-3 w-64 rounded-2xl border border-border-subtle bg-surface p-2 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.45)]"
        >
          <div className="border-b border-border-subtle px-3 py-2" role="presentation">
            <p className="truncate text-sm font-semibold">{user.displayName || "Minha conta"}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
          <Link
            href="/dashboard/settings/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="mt-1 flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-foreground transition hover:bg-surface-strong"
          >
            Meu perfil
          </Link>
          <LogoutButton menuItem />
        </div>
      )}
    </div>
  );
}

export function DashboardShell({ children, user }: { children: React.ReactNode; user: ShellUser }) {
  const pathname = usePathname();
  const active = (href: string) => href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border-subtle bg-surface/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/dashboard" aria-label="Finapp Finances" className="flex items-center gap-3 rounded-xl font-bold tracking-tight">
            <span className="grid size-10 place-items-center rounded-xl bg-primary text-on-primary shadow-sm" aria-hidden>F</span>
            <span aria-hidden>
              <span className="block text-sm leading-tight">Finapp</span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Open Source</span>
            </span>
          </Link>
          <UserMenu user={user} />
        </div>
      </header>
      <div className="mx-auto flex max-w-6xl gap-8 px-4 pb-24 pt-6 sm:px-6 lg:pb-10">
        <nav aria-label="Navegação principal" className="sticky top-24 hidden h-fit w-52 shrink-0 space-y-1 lg:block">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} aria-current={active(item.href) ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${active(item.href) ? "bg-primary-container text-on-primary-container" : "text-muted hover:bg-surface-strong hover:text-foreground"}`}>
              <Icon name={item.icon} />{item.label}
            </Link>
          ))}
        </nav>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
      <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border-subtle bg-surface/95 px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_-24px_rgba(15,23,42,0.35)] backdrop-blur-xl lg:hidden">
        {mobileNavigation.map((item) => (
          <Link key={item.href} href={item.href} aria-current={active(item.href) ? "page" : undefined} className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold transition ${active(item.href) ? "text-primary" : "text-muted"}`}>
            <Icon name={item.icon} className="size-5" />{item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

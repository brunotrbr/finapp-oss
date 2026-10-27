import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth/login-form";
import { getCurrentUser } from "@/infrastructure/auth/session";

export const metadata: Metadata = {
  title: "Entrar | Finapp Finances",
};

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="flex flex-1 items-center justify-center bg-background px-4 py-8 font-sans sm:px-6 lg:py-12">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-border-subtle bg-surface shadow-[0_32px_80px_-48px_rgba(15,118,110,0.65)] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden bg-gradient-to-br from-on-primary-container via-primary to-secondary p-10 text-on-primary lg:flex lg:flex-col lg:justify-between">
          <div><span className="grid size-14 place-items-center rounded-2xl bg-white/15 text-xl font-bold ring-1 ring-white/20" aria-hidden>F</span><p className="mt-8 text-xs font-semibold uppercase tracking-[0.16em]">Finapp Finances • Open Source</p><h1 className="mt-4 max-w-md text-4xl font-bold tracking-tight">Suas finanças em uma visão simples e prática.</h1><p className="mt-4 max-w-md text-sm leading-7">Organize contas, lançamentos, pendências e cartões sem perder o contexto do que importa agora.</p></div>
          <ul className="mt-10 grid gap-3 text-sm" aria-label="Recursos principais"><li className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">Saldo e compromissos no mesmo painel</li><li className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">Navegação pensada primeiro para celular</li></ul>
        </section>
        <section className="p-4 sm:p-8 lg:p-10"><div className="mb-7 text-center lg:text-left"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary text-xl font-bold text-on-primary shadow-lg shadow-primary/20 lg:mx-0" aria-hidden>F</span><p className="mt-4 font-bold text-foreground"><span>Finapp Finances</span><span className="ml-2 rounded-full bg-primary-container px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-primary">Open Source</span></p><p className="mt-2 text-sm text-muted">Organize suas finanças com clareza</p></div><LoginForm /></section>
      </div>
    </main>
  );
}

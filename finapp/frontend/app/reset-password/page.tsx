import type { Metadata } from "next";
import { ResetPasswordForm } from "@/features/auth/reset-password-form";

export const metadata: Metadata = { title: "Criar nova senha" };

export default async function Page({ searchParams }: { searchParams: Promise<{ mode?: string; oobCode?: string }> }) {
  const { mode, oobCode } = await searchParams;
  return <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10"><section className="w-full max-w-md"><div className="mb-7 text-center"><span aria-hidden className="mx-auto grid size-16 place-items-center rounded-full bg-primary text-2xl text-on-primary shadow-lg shadow-primary/20">▣</span><h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground">Crie uma nova senha</h1><p className="mt-3 text-sm leading-6 text-muted">Defina uma senha forte para recuperar seu acesso.</p></div><div className="rounded-3xl border border-border-subtle bg-surface p-6 shadow-[0_24px_60px_-40px_rgba(15,118,110,0.55)]"><ResetPasswordForm mode={mode} oobCode={oobCode} /></div></section></main>;
}

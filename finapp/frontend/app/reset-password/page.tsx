import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/features/auth/reset-password-form";

export const metadata: Metadata = { title: "Criar nova senha | Finapp Finances" };

export default async function Page({ searchParams }: { searchParams: Promise<{ mode?: string; oobCode?: string }> }) {
  const { mode, oobCode } = await searchParams;
  return <main className="flex flex-1 items-center justify-center bg-background px-4 py-10"><section className="w-full max-w-md rounded-3xl border border-border-subtle bg-surface p-6 shadow-[0_24px_60px_-36px_rgba(15,118,110,0.55)] sm:p-8"><div className="mb-6 grid size-12 place-items-center rounded-2xl bg-primary text-lg font-bold text-on-primary" aria-hidden>F</div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Recuperação segura</p><h1 className="mt-2 text-2xl font-bold">Crie uma nova senha</h1><p className="mb-6 mt-2 text-sm text-muted">Valide o link recebido e escolha uma senha com 8 ou mais caracteres, incluindo maiúscula, número e símbolo.</p><ResetPasswordForm mode={mode} oobCode={oobCode} /><Link href="/login" className="mt-6 block text-center text-sm font-semibold text-primary underline-offset-4 hover:underline">Voltar para entrar</Link></section></main>;
}

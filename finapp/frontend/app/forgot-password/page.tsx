import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";

export const metadata: Metadata = { title: "Recuperar acesso | Finapp Finances" };

export default function Page() {
  return <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10"><div className="w-full max-w-lg"><div className="mb-7 text-center"><span className="mx-auto grid size-20 place-items-center rounded-full bg-primary-container text-3xl text-primary ring-8 ring-primary-container/40" aria-hidden>↗</span><p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-tertiary">Acesso seguro</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Esqueceu sua senha?</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">Digite o e-mail cadastrado. Enviaremos um link para você redefinir seu acesso.</p></div><ForgotPasswordForm /><aside className="mt-5 rounded-2xl bg-surface-subtle p-4 text-sm leading-6 text-muted"><strong className="text-foreground">Aviso de segurança</strong><br />Use apenas o link mais recente enviado ao seu e-mail.</aside></div></main>;
}

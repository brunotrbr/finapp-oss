import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth/login-form";
import { getCurrentUser } from "@/infrastructure/auth/session";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  return <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-8 sm:px-6"><div className="w-full max-w-md"><div className="mb-7 text-center"><span aria-hidden className="mx-auto grid size-16 place-items-center rounded-2xl bg-primary text-2xl font-black text-on-primary shadow-lg shadow-primary/20">F</span><p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-tertiary">Finapp Finances</p></div><LoginForm /><p className="mt-5 text-center text-xs text-muted">Ambiente protegido por sessão segura</p></div></main>;
}

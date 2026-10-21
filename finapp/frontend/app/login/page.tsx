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
    <div className="flex flex-1 items-center justify-center bg-background px-4 py-10 font-sans">
      <div className="w-full max-w-md"><div className="mb-7 text-center"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary text-xl font-bold text-on-primary shadow-lg shadow-primary/20" aria-hidden>F</span><p className="mt-4 font-bold text-foreground"><span>Finapp Finances</span><span className="ml-2 rounded-full bg-primary-container px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-primary">Open Source</span></p><p className="mt-2 text-sm text-muted">Organize suas finanças com clareza</p></div><LoginForm /></div>
    </div>
  );
}

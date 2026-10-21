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
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-10 font-sans dark:bg-black">
      <div className="w-full max-w-sm"><div className="mb-6 text-center"><p className="text-xl font-bold">Finapp Finances</p><p className="mt-1 text-sm text-zinc-500">Suas finanças em um só lugar</p></div><LoginForm /></div>
    </div>
  );
}

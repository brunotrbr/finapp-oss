import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { demoFinanceAccounts, formatHeaderDate } from "@/lib/finance-data";
import { FinanceDashboard } from "./finance-dashboard";

export const metadata: Metadata = {
  title: "Caderno — Finanças Pessoais | Finapp",
  description: "Saldo total, contas do mês, contas pendentes e últimos lançamentos em um só lugar.",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const userLabel = user.displayName?.trim() || user.email || "Minha conta";
  const nameParts = userLabel.split(/\s+/);
  const initials = (nameParts.length > 1
    ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`
    : userLabel.slice(0, 2)
  ).toLocaleUpperCase("pt-BR");

  return (
    <FinanceDashboard
      accounts={demoFinanceAccounts}
      initials={initials}
      userLabel={userLabel}
      headerDate={formatHeaderDate(new Date())}
    />
  );
}

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/infrastructure/auth/session";
import { DashboardShell } from "@/features/dashboard-shell/dashboard-shell";
import { FinanceProvider } from "@/features/finance/model/finance-context";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const serializableUser = { email: user.email, displayName: user.displayName, photoURL: user.photoURL };
  return <FinanceProvider initialName={user.displayName}><DashboardShell user={serializableUser}>{children}</DashboardShell></FinanceProvider>;
}

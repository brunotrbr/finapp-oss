import { AccountForm } from "@/features/finance/accounts/account-form";
export default async function Page({ params }: { params: Promise<{ accountId: string }> }) { const { accountId } = await params; return <AccountForm accountId={accountId} />; }

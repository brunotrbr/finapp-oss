import { AccountDetail } from "@/features/finance/accounts/account-detail";
export default async function Page({ params }: { params: Promise<{ accountId: string }> }) { const { accountId } = await params; return <AccountDetail accountId={accountId} />; }

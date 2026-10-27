import { TransactionForm } from "@/features/finance/transactions/transaction-form";
export default async function Page({ searchParams }: { searchParams: Promise<{ account?: string }> }) { const { account } = await searchParams; return <TransactionForm initialAccountId={account} />; }

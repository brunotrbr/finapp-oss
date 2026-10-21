import { TransactionForm } from "@/features/finance/transactions/transaction-form";
export default async function Page({ params }: { params: Promise<{ transactionId: string }> }) { const { transactionId } = await params; return <TransactionForm transactionId={transactionId} />; }

import { BillDetail } from "@/features/finance/bills/bill-detail";
export default async function Page({ params }: { params: Promise<{ billId: string }> }) { const { billId } = await params; return <BillDetail billId={billId} />; }

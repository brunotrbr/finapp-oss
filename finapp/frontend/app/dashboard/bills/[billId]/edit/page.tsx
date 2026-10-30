import { BillForm } from "@/features/finance/bills/bill-form";

export default async function Page({ params }: { params: Promise<{ billId: string }> }) {
  const { billId } = await params;
  return <BillForm billId={billId} />;
}

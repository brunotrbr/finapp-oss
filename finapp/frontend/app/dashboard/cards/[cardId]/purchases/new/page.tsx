import { PurchaseForm } from "@/features/finance/purchases/purchase-form";
export default async function Page({ params }: { params: Promise<{ cardId: string }> }) { const { cardId } = await params; return <PurchaseForm cardId={cardId} />; }

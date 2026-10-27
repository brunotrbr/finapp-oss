import { InvoiceScreen } from "@/features/finance/cards/invoice-screen";

export default async function Page({ params }: { params: Promise<{ cardId: string }> }) {
  const { cardId } = await params;
  return <InvoiceScreen cardId={cardId} />;
}

import { CardDetail } from "@/features/finance/cards/card-detail";
export default async function Page({ params }: { params: Promise<{ cardId: string }> }) { const { cardId } = await params; return <CardDetail cardId={cardId} />; }

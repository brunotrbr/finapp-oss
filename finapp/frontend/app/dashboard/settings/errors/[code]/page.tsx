import { ErrorGallery } from "@/features/settings/error-gallery";
export default async function Page({ params }: { params: Promise<{ code: string }> }) { const { code } = await params; return <ErrorGallery code={code} />; }

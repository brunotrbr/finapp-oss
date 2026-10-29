import Link from "next/link";
import { buttonClass } from "@/shared/ui/styles";

export default function NotFound() {
  return <main className="grid min-h-dvh place-items-center bg-background p-6 text-center text-foreground"><div><p className="text-6xl font-black text-primary">404</p><h1 className="mt-4 text-2xl font-bold">Página não encontrada</h1><p className="mt-2 text-sm text-muted">O endereço informado não existe.</p><Link href="/dashboard" className={`${buttonClass} mt-6`}>Ir para o início</Link></div></main>;
}

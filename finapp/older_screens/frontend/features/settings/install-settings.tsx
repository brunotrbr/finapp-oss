import { Card } from "@/shared/ui/card";
import { PageHeader } from "@/shared/ui/page-header";

export function InstallSettings() {
  return <div className="space-y-6"><PageHeader title="Instalar no celular" eyebrow="Dispositivo" /><Card><h2 className="font-bold">Adicionar à tela inicial</h2><p className="mt-2 text-sm leading-6 text-muted">Esta versão é apenas uma aplicação web responsiva. PWA, service worker e instalação offline ainda não fazem parte da entrega.</p></Card></div>;
}

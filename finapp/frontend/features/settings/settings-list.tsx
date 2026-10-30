import { Card } from "@/shared/ui/card";
import { EntityRow } from "@/shared/ui/entity-row";
import { PageHeader } from "@/shared/ui/page-header";

const settings = [
  ["Perfil", "Nome exibido somente nesta sessão", "/dashboard/settings/profile"],
  ["Segurança", "Sessão e autenticação", "/dashboard/settings/security"],
  ["Instalação", "Uso no celular", "/dashboard/settings/install"],
  ["Sobre", "Escopo e versão do Finapp", "/dashboard/settings/about"],
];

export function SettingsList() {
  return <div className="space-y-6"><PageHeader title="Ajustes" /><Card>{settings.map(([title, subtitle, href]) => <EntityRow key={href} title={title} subtitle={subtitle} href={href} />)}</Card></div>;
}

import { LogoutButton } from "@/features/auth/logout-button";
import { Notice } from "@/shared/ui/feedback";
import { PageHeader } from "@/shared/ui/page-header";

export function SecuritySettings() {
  return <div className="space-y-6"><PageHeader title="Segurança e sessão" /><Notice>Ao encerrar, a sessão Firebase do navegador e o cookie seguro do servidor são invalidados antes do redirecionamento.</Notice><LogoutButton /></div>;
}

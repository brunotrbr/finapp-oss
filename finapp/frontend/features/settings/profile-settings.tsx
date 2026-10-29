"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { requiredError } from "@/domain/finance/validation";
import { useFinance } from "@/features/finance/model/finance-context";
import { Field } from "@/shared/ui/field";
import { Notice } from "@/shared/ui/feedback";
import { PageHeader } from "@/shared/ui/page-header";
import { buttonClass, formCardClass, inputClass } from "@/shared/ui/styles";

export function ProfileSettings() {
  const { state, dispatch, remote } = useFinance();
  const router = useRouter();
  const [error, setError] = useState("");
  if (remote) return <div className="space-y-6"><PageHeader title="Meu perfil" eyebrow="Preferências" /><Notice>O nome vem do Firebase. A API financeira não oferece atualização de perfil.</Notice></div>;
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = String(new FormData(event.currentTarget).get("name") || "");
    const validation = requiredError(name);
    if (validation) { setError(validation); return; }
    dispatch({ type: "profile/name", name });
    router.push("/dashboard/settings");
  }
  return <div className="space-y-6"><PageHeader title="Meu perfil" eyebrow="Preferências" /><form onSubmit={submit} className={formCardClass}><Field label="Nome exibido" error={error}><input name="name" className={inputClass} defaultValue={state.displayName} required /></Field><button className={`${buttonClass} w-full`}>Salvar nome</button></form><Notice>Esta alteração fica somente em memória. Ela não atualiza o perfil do Firebase e será perdida ao recarregar.</Notice></div>;
}

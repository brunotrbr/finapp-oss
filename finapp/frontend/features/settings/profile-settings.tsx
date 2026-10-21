"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { requiredError } from "@/domain/finance/validation";
import { useFinance } from "@/features/finance/model/finance-context";
import { Field } from "@/shared/ui/field";
import { Notice } from "@/shared/ui/feedback";
import { PageHeader } from "@/shared/ui/page-header";
import { buttonClass, inputClass } from "@/shared/ui/styles";

export function ProfileSettings() {
  const { state, dispatch } = useFinance();
  const router = useRouter();
  const [error, setError] = useState("");
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = String(new FormData(event.currentTarget).get("name") || "");
    const validation = requiredError(name);
    if (validation) { setError(validation); return; }
    dispatch({ type: "profile/name", name });
    router.push("/dashboard/settings");
  }
  return <div className="space-y-6"><PageHeader title="Meu perfil" /><form onSubmit={submit} className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"><Field label="Nome exibido" error={error}><input name="name" className={inputClass} defaultValue={state.displayName} required /></Field><button className={buttonClass}>Salvar nome</button></form><Notice>Esta alteração fica somente em memória. Ela não atualiza o perfil do Firebase e será perdida ao recarregar.</Notice></div>;
}

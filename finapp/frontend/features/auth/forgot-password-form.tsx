"use client";

import Link from "next/link";
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { firebaseAuth } from "@/infrastructure/firebase/client";
import { Field } from "@/shared/ui/field";
import { buttonClass, inputClass, secondaryButtonClass } from "@/shared/ui/styles";

const neutralMessage = "Se houver uma conta para este e-mail, você receberá as instruções de recuperação.";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    try {
      if (process.env.NEXT_PUBLIC_FINAPP_E2E_AUTH !== "1") await sendPasswordResetEmail(firebaseAuth(), email);
    } catch {
      // Resposta neutra evita enumeração de contas.
    } finally {
      setPending(false);
      setSent(true);
    }
  }

  return <form onSubmit={submit} className="grid gap-5 rounded-3xl border border-border-subtle bg-surface p-5 shadow-[0_18px_50px_-34px_rgba(15,118,110,0.5)] sm:p-7"><Field label="E-mail cadastrado"><input type="email" autoComplete="email" required className={inputClass} value={email} onChange={(event) => { setEmail(event.target.value); setSent(false); }} /></Field>{sent && <p role="status" className="rounded-2xl bg-primary-container p-4 text-sm leading-6 text-on-primary-container">{neutralMessage}</p>}<button className={`${buttonClass} w-full`} disabled={pending}>{pending ? "Enviando…" : "Enviar link de recuperação"}</button><Link className={`${secondaryButtonClass} w-full`} href="/login">Voltar para entrar</Link></form>;
}

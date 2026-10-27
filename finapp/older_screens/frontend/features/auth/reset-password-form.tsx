"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { firebaseAuth } from "@/infrastructure/firebase/client";
import { buttonClass, inputClass, secondaryButtonClass } from "@/shared/ui/styles";

type Props = { mode?: string; oobCode?: string };

export function ResetPasswordForm({ mode, oobCode }: Props) {
  const validParams = mode === "resetPassword" && Boolean(oobCode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(validParams);
  const [error, setError] = useState(validParams ? "" : "Link de recuperação inválido. Solicite um novo link.");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!validParams || !oobCode) return;
    let active = true;
    verifyPasswordResetCode(firebaseAuth(), oobCode)
      .then((verifiedEmail) => { if (active) setEmail(verifiedEmail); })
      .catch(() => { if (active) setError("Este link expirou ou já foi usado. Solicite um novo link."); })
      .finally(() => { if (active) setPending(false); });
    return () => { active = false; };
  }, [oobCode, validParams]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password !== confirmation) { setError("As senhas não coincidem."); return; }
    if (!oobCode || password.length < 6) { setError("A senha deve ter pelo menos 6 caracteres."); return; }
    setPending(true);
    try {
      await confirmPasswordReset(firebaseAuth(), oobCode, password);
      setSuccess(true);
    } catch {
      setError("Não foi possível alterar a senha. O link pode ter expirado ou já ter sido usado.");
    } finally {
      setPending(false);
    }
  }

  if (pending && !email && !error) return <p role="status" className="text-sm text-muted">Validando link…</p>;
  if (error && !email) return <div className="space-y-4"><p role="alert" className="rounded-xl bg-expense-container p-3 text-sm text-expense">{error}</p><Link href="/login" className={secondaryButtonClass}>Voltar para entrar</Link></div>;
  if (success) return <div className="space-y-4"><p role="status" className="rounded-xl bg-income-container p-3 text-sm text-income">Senha alterada com sucesso.</p><Link href="/login" className={buttonClass}>Entrar com a nova senha</Link></div>;

  return <form onSubmit={submit} className="grid gap-4"><p className="text-sm text-muted">Criando uma nova senha para <strong className="text-foreground">{email}</strong>.</p><label className="grid gap-1.5 text-sm font-medium">Nova senha<input className={inputClass} type="password" autoComplete="new-password" minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} /></label><label className="grid gap-1.5 text-sm font-medium">Confirmar nova senha<input className={inputClass} type="password" autoComplete="new-password" minLength={6} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label>{error && <p role="alert" className="rounded-xl bg-expense-container p-3 text-sm text-expense">{error}</p>}<button className={buttonClass} disabled={pending}>{pending ? "Alterando…" : "Criar nova senha"}</button></form>;
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { authErrorMessage } from "@/features/auth/auth-errors";
import { firebaseAuth, googleProvider } from "@/infrastructure/firebase/client";
import { buttonClass, inputClass, secondaryButtonClass } from "@/shared/ui/styles";

type Mode = "login" | "register" | "reset";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function startSessionToken(idToken: string) {
    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      await signOut(firebaseAuth());
      throw new Error("session");
    }

    router.replace("/dashboard");
    router.refresh();
  }

  async function startSession(user: User) {
    await startSessionToken(await user.getIdToken());
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    if (mode === "reset") {
      try {
        if (process.env.NEXT_PUBLIC_FINAPP_E2E_AUTH !== "1") await sendPasswordResetEmail(firebaseAuth(), email);
      } catch {
        // A resposta é intencionalmente genérica para não enumerar usuários.
      }
      setMessage("Se houver uma conta para este e-mail, você receberá as instruções de recuperação.");
      setPending(false);
      return;
    }

    try {
      if (process.env.NEXT_PUBLIC_FINAPP_E2E_AUTH === "1") {
        await startSessionToken("finapp-e2e-token");
        return;
      }
      const auth = firebaseAuth();
      const credential =
        mode === "register"
          ? await createUserWithEmailAndPassword(auth, email, password)
          : await signInWithEmailAndPassword(auth, email, password);
      await startSession(credential.user);
    } catch (err) {
      setError(authErrorMessage(err));
      setPending(false);
    }
  }

  async function handleGoogle() {
    setError("");
    setPending(true);

    try {
      if (process.env.NEXT_PUBLIC_FINAPP_E2E_AUTH === "1") {
        await startSessionToken("finapp-e2e-token");
        return;
      }
      const credential = await signInWithPopup(firebaseAuth(), googleProvider());
      await startSession(credential.user);
    } catch (err) {
      setError(authErrorMessage(err));
      setPending(false);
    }
  }

  return (
    <div className="w-full rounded-3xl border border-border-subtle bg-surface p-6 shadow-[0_24px_60px_-36px_rgba(15,118,110,0.55)] sm:p-8">
      <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {mode === "login" ? "Entrar" : mode === "register" ? "Criar conta" : "Recuperar acesso"}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {mode === "login" ? "Bem-vindo de volta ao seu espaço financeiro." : mode === "register" ? "Comece com seus dados essenciais." : "Enviaremos instruções para o e-mail informado."}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
          E-mail
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
          />
        </label>

        {mode !== "reset" && <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
          Senha
          <input
            type="password"
            name="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClass}
          />
        </label>}

        {error && (
          <p role="alert" className="rounded-xl bg-expense-container p-3 text-sm text-expense">
            {error}
          </p>
        )}
        {message && <p role="status" className="rounded-xl bg-primary-container p-3 text-sm text-on-primary-container">{message}</p>}

        <button
          type="submit"
          disabled={pending}
          className={`${buttonClass} w-full text-base`}
        >
          {pending ? "Aguarde…" : mode === "login" ? "Entrar" : mode === "register" ? "Criar conta" : "Enviar instruções"}
        </button>
      </form>

      {mode !== "reset" && <><div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wide text-muted">
        <span className="h-px flex-1 bg-border-subtle" />
        ou
        <span className="h-px flex-1 bg-border-subtle" />
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={pending}
        className={`${secondaryButtonClass} w-full text-base`}
      >
        Continuar com Google
      </button>
      </>}

      <button
        type="button"
        onClick={() => {
          setMode(mode === "login" ? "register" : "login");
          setError("");
          setMessage("");
        }}
        className="mt-6 min-h-11 w-full text-sm font-semibold text-primary underline-offset-4 hover:underline"
      >
        {mode === "login" ? "Ainda não tem conta? Cadastre-se" : "Voltar para entrar"}
      </button>
      {mode === "login" && <button type="button" onClick={() => { setMode("reset"); setError(""); setMessage(""); }} className="mt-1 min-h-11 w-full text-sm font-medium text-muted underline-offset-4 hover:text-primary hover:underline">Esqueci minha senha</button>}
    </div>
  );
}

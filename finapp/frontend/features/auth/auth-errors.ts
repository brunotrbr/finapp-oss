import { FirebaseError } from "firebase/app";

const MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "E-mail ou senha inválidos.",
  "auth/invalid-email": "Informe um e-mail válido.",
  "auth/user-disabled": "Esta conta foi desativada.",
  "auth/email-already-in-use": "Já existe uma conta com este e-mail.",
  "auth/weak-password": "A senha deve ter pelo menos 6 caracteres.",
  "auth/too-many-requests": "Muitas tentativas. Tente novamente mais tarde.",
  "auth/popup-closed-by-user": "O login com Google foi cancelado.",
  "auth/cancelled-popup-request": "O login com Google foi cancelado.",
  "auth/popup-blocked": "O navegador bloqueou a janela de login.",
  "auth/account-exists-with-different-credential":
    "Este e-mail já usa outro método de login.",
};

export function authErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    return MESSAGES[error.code] ?? "Não foi possível entrar. Tente novamente.";
  }
  return "Algo deu errado. Tente novamente.";
}

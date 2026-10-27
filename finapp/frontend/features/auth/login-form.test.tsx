import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FirebaseError } from "firebase/app";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "./login-form";

const mocks = vi.hoisted(() => ({
  auth: { name: "auth" },
  provider: { name: "google" },
  createUser: vi.fn(),
  fetch: vi.fn(),
  refresh: vi.fn(),
  replace: vi.fn(),
  reset: vi.fn(),
  signIn: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace, refresh: mocks.refresh }),
}));
vi.mock("@/infrastructure/firebase/client", () => ({
  firebaseAuth: () => mocks.auth,
  googleProvider: () => mocks.provider,
}));
vi.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: mocks.createUser,
  sendPasswordResetEmail: mocks.reset,
  signInWithEmailAndPassword: mocks.signIn,
  signInWithPopup: mocks.signInWithPopup,
  signOut: mocks.signOut,
}));

function userCredential(token = "id-token") {
  return { user: { getIdToken: vi.fn().mockResolvedValue(token) } };
}

async function fillCredentials() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("E-mail"), "ana@example.com");
  await user.type(screen.getByLabelText("Senha"), "senha-segura");
  return user;
}

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.NEXT_PUBLIC_FINAPP_E2E_AUTH;
    mocks.fetch.mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", mocks.fetch);
  });

  it("autentica por e-mail, troca o ID token por sessão e redireciona", async () => {
    const credential = userCredential();
    mocks.signIn.mockResolvedValue(credential);
    render(<LoginForm />);
    const user = await fillCredentials();

    await user.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/dashboard"));
    expect(mocks.signIn).toHaveBeenCalledWith(mocks.auth, "ana@example.com", "senha-segura");
    expect(credential.user.getIdToken).toHaveBeenCalledTimes(1);
    expect(mocks.fetch).toHaveBeenCalledWith("/api/auth/session", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ idToken: "id-token" }),
    }));
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
  });

  it("cadastra pelo método Firebase dedicado", async () => {
    mocks.createUser.mockResolvedValue(userCredential("register-token"));
    render(<LoginForm />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Cadastre-se/ }));
    await user.type(screen.getByLabelText("E-mail"), "nova@example.com");
    await user.type(screen.getByLabelText("Senha"), "senha-segura");
    await user.click(screen.getByRole("button", { name: "Criar conta" }));

    await waitFor(() => expect(mocks.createUser).toHaveBeenCalledWith(mocks.auth, "nova@example.com", "senha-segura"));
    expect(mocks.signIn).not.toHaveBeenCalled();
  });

  it("usa popup e provider próprios no login Google", async () => {
    mocks.signInWithPopup.mockResolvedValue(userCredential("google-token"));
    render(<LoginForm />);

    await userEvent.click(screen.getByRole("button", { name: "Continuar com Google" }));

    await waitFor(() => expect(mocks.signInWithPopup).toHaveBeenCalledWith(mocks.auth, mocks.provider));
    expect(mocks.fetch).toHaveBeenCalledWith("/api/auth/session", expect.objectContaining({
      body: JSON.stringify({ idToken: "google-token" }),
    }));
  });

  it("informa popup cancelado e libera os controles para nova tentativa", async () => {
    mocks.signInWithPopup.mockRejectedValue(new FirebaseError("auth/popup-closed-by-user", "cancelado"));
    render(<LoginForm />);

    await userEvent.click(screen.getByRole("button", { name: "Continuar com Google" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("login com Google foi cancelado");
    expect(screen.getByRole("button", { name: "Continuar com Google" })).toBeEnabled();
  });

  it("mantém estado pendente durante autenticação", async () => {
    let resolveCredential!: (value: ReturnType<typeof userCredential>) => void;
    mocks.signIn.mockReturnValue(new Promise((resolve) => { resolveCredential = resolve; }));
    render(<LoginForm />);
    const user = await fillCredentials();
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(screen.getByRole("button", { name: "Aguarde…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Continuar com Google" })).toBeDisabled();

    resolveCredential(userCredential());
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/dashboard"));
  });

  it("desfaz autenticação e exibe erro quando a sessão servidor falha", async () => {
    mocks.signIn.mockResolvedValue(userCredential());
    mocks.fetch.mockResolvedValue({ ok: false });
    mocks.signOut.mockResolvedValue(undefined);
    render(<LoginForm />);
    const user = await fillCredentials();

    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Algo deu errado");
    expect(mocks.signOut).toHaveBeenCalledWith(mocks.auth);
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Entrar" })).toBeEnabled();
  });

  it("leva a recuperação para sua rota pública dedicada", () => {
    render(<LoginForm />);
    expect(screen.getByRole("link", { name: /esqueci minha senha/i })).toHaveAttribute("href", "/forgot-password");
    expect(screen.queryByRole("button", { name: /enviar instruções/i })).not.toBeInTheDocument();
  });
});

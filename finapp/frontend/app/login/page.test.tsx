import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LoginPage from "./page";

const { getCurrentUser, redirect } = vi.hoisted(() => ({ getCurrentUser: vi.fn(), redirect: vi.fn() }));

vi.mock("@/infrastructure/auth/session", () => ({ getCurrentUser }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/features/auth/login-form", () => ({
  LoginForm: ({ showHeading = true }: { showHeading?: boolean }) => {
    const [register, setRegister] = useState(false);
    return <div>{showHeading && <h1>{register ? "Criar conta" : "Bem-vindo de volta"}</h1>}<p>Formulário de acesso</p><button onClick={() => setRegister(true)}>Cadastre-se</button></div>;
  },
}));

describe("LoginPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redireciona uma sessão servidor válida para o dashboard", async () => {
    getCurrentUser.mockResolvedValue({ uid: "user-1", email: "ana@example.com", displayName: "Ana", photoURL: null });
    render(await LoginPage());
    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("mantém a hierarquia Stitch e o formulário para sessão ausente", async () => {
    getCurrentUser.mockResolvedValue(null);
    render(await LoginPage());
    expect(redirect).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Bem-vindo de volta" })).toBeInTheDocument();
    expect(screen.getByText("Formulário de acesso")).toBeInTheDocument();
  });

  it("mantém um heading coerente ao alternar da página de login para cadastro", async () => {
    getCurrentUser.mockResolvedValue(null);
    render(await LoginPage());
    await userEvent.click(screen.getByRole("button", { name: "Cadastre-se" }));
    expect(screen.getByRole("heading", { name: "Criar conta" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Bem-vindo de volta" })).not.toBeInTheDocument();
  });
});

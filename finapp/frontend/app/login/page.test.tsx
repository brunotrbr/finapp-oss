import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LoginPage from "./page";

const { getCurrentUser, redirect } = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@/infrastructure/auth/session", () => ({ getCurrentUser }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/features/auth/login-form", () => ({ LoginForm: () => <h1>Entrar</h1> }));

describe("LoginPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redireciona uma sessão servidor válida para o dashboard", async () => {
    getCurrentUser.mockResolvedValue({ uid: "user-1", email: "ana@example.com", displayName: "Ana", photoURL: null });
    render(await LoginPage());
    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("mantém o formulário para sessão ausente ou inválida", async () => {
    getCurrentUser.mockResolvedValue(null);
    render(await LoginPage());
    expect(redirect).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Entrar" })).toBeInTheDocument();
  });
});

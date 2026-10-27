import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForgotPasswordForm } from "./forgot-password-form";

const mocks = vi.hoisted(() => ({ auth: { name: "auth" }, reset: vi.fn() }));

vi.mock("@/infrastructure/firebase/client", () => ({ firebaseAuth: () => mocks.auth }));
vi.mock("firebase/auth", () => ({ sendPasswordResetEmail: mocks.reset }));

describe("ForgotPasswordForm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("envia o link e responde de forma genérica", async () => {
    mocks.reset.mockResolvedValue(undefined);
    render(<ForgotPasswordForm />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("E-mail cadastrado"), "ana@example.com");
    await user.click(screen.getByRole("button", { name: "Enviar link de recuperação" }));

    await waitFor(() => expect(mocks.reset).toHaveBeenCalledWith(mocks.auth, "ana@example.com"));
    expect(screen.getByRole("status")).toHaveTextContent("Se houver uma conta");
  });

  it("mantém a mesma resposta quando o Firebase rejeita", async () => {
    mocks.reset.mockRejectedValue(new Error("user-not-found"));
    render(<ForgotPasswordForm />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("E-mail cadastrado"), "desconhecido@example.com");
    await user.click(screen.getByRole("button", { name: "Enviar link de recuperação" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Se houver uma conta");
  });
});

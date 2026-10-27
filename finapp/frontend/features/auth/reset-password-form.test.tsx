import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FirebaseError } from "firebase/app";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ResetPasswordForm } from "./reset-password-form";

const mocks = vi.hoisted(() => ({ auth: { name: "auth" }, confirm: vi.fn(), verify: vi.fn() }));

vi.mock("@/infrastructure/firebase/client", () => ({ firebaseAuth: () => mocks.auth }));
vi.mock("firebase/auth", () => ({
  confirmPasswordReset: mocks.confirm,
  verifyPasswordResetCode: mocks.verify,
}));

describe("ResetPasswordForm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejeita parâmetros ausentes sem consultar o Firebase", () => {
    render(<ResetPasswordForm mode={undefined} oobCode={undefined} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Link de recuperação inválido");
    expect(mocks.verify).not.toHaveBeenCalled();
  });

  it("valida o código e confirma senhas iguais", async () => {
    mocks.verify.mockResolvedValue("ana@example.com");
    mocks.confirm.mockResolvedValue(undefined);
    render(<ResetPasswordForm mode="resetPassword" oobCode="valid-code" />);
    expect(await screen.findByText("ana@example.com")).toBeInTheDocument();
    const user = userEvent.setup();
    expect(screen.getByText("8+ caracteres")).toBeInTheDocument();
    expect(screen.getByText("Letra maiúscula")).toBeInTheDocument();
    expect(screen.getByText("Número")).toBeInTheDocument();
    expect(screen.getByText("Caractere especial")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Nova senha"), "Senha-Nova1!");
    await user.type(screen.getByLabelText("Confirmar nova senha"), "Senha-Nova1!");
    await user.click(screen.getByRole("button", { name: "Criar nova senha" }));
    await waitFor(() => expect(mocks.confirm).toHaveBeenCalledWith(mocks.auth, "valid-code", "Senha-Nova1!"));
    expect(screen.getByRole("status")).toHaveTextContent("Senha alterada");
  });

  it("não envia senhas divergentes", async () => {
    mocks.verify.mockResolvedValue("ana@example.com");
    render(<ResetPasswordForm mode="resetPassword" oobCode="valid-code" />);
    await screen.findByText("ana@example.com");
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Nova senha"), "senha-nova");
    await user.type(screen.getByLabelText("Confirmar nova senha"), "outra-senha");
    await user.click(screen.getByRole("button", { name: "Criar nova senha" }));
    expect(screen.getByRole("alert")).toHaveTextContent("senhas não coincidem");
    expect(mocks.confirm).not.toHaveBeenCalled();
  });

  it("não envia senha que não atende aos requisitos exibidos", async () => {
    mocks.verify.mockResolvedValue("ana@example.com");
    render(<ResetPasswordForm mode="resetPassword" oobCode="valid-code" />);
    await screen.findByText("ana@example.com");
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Nova senha"), "senhafraca");
    await user.type(screen.getByLabelText("Confirmar nova senha"), "senhafraca");
    await user.click(screen.getByRole("button", { name: "Criar nova senha" }));
    expect(screen.getByRole("alert")).toHaveTextContent("maiúscula, número e caractere especial");
    expect(mocks.confirm).not.toHaveBeenCalled();
  });

  it("trata código expirado com mensagem segura", async () => {
    mocks.verify.mockRejectedValue(new FirebaseError("auth/expired-action-code", "expired"));
    render(<ResetPasswordForm mode="resetPassword" oobCode="expired-code" />);
    expect(await screen.findByRole("alert")).toHaveTextContent("expirou ou já foi usado");
  });
});

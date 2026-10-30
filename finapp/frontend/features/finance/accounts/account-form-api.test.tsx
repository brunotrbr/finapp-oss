import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FinanceApiError } from "@/infrastructure/api/http-client";
import { AccountForm } from "./account-form";

const mocks = vi.hoisted(() => ({ createAccount: vi.fn(), push: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/features/finance/model/finance-context", () => ({
  useFinance: () => ({
    state: { accounts: [] },
    createAccount: mocks.createAccount,
    updateAccount: vi.fn(),
    remote: true,
  }),
}));

describe("AccountForm com API", () => {
  beforeEach(() => {
    mocks.createAccount.mockReset();
    mocks.push.mockReset();
  });

  it("associa erro 422 seguro ao campo conhecido", async () => {
    mocks.createAccount.mockRejectedValue(new FinanceApiError(422, "validation_failed", false, {
      name: ["Este nome já está em uso."],
    }));
    render(<AccountForm />);

    fireEvent.change(screen.getByLabelText("Nome da conta"), { target: { value: "Duplicada" } });
    fireEvent.change(screen.getByLabelText("Saldo inicial (R$)"), { target: { value: "10" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar conta" }));

    const input = screen.getByLabelText("Nome da conta");
    await waitFor(() => expect(input).toHaveAttribute("aria-invalid", "true"));
    expect(screen.getByText("Este nome já está em uso.")).toBeInTheDocument();
    expect(mocks.push).not.toHaveBeenCalled();
  });
});

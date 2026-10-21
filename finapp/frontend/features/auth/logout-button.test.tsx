import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LogoutButton } from "./logout-button";

const mocks = vi.hoisted(() => ({
  auth: { name: "auth" },
  fetch: vi.fn(),
  refresh: vi.fn(),
  replace: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace, refresh: mocks.refresh }),
}));
vi.mock("@/infrastructure/firebase/client", () => ({ firebaseAuth: () => mocks.auth }));
vi.mock("firebase/auth", () => ({ signOut: mocks.signOut }));

describe("LogoutButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.NEXT_PUBLIC_FINAPP_E2E_AUTH;
    vi.stubGlobal("fetch", mocks.fetch);
  });

  it("encerra Firebase, remove a sessão servidor e só então redireciona", async () => {
    const order: string[] = [];
    mocks.signOut.mockImplementation(async () => { order.push("firebase"); });
    mocks.fetch.mockImplementation(async () => { order.push("server"); return { ok: true }; });
    mocks.replace.mockImplementation(() => { order.push("redirect"); });
    render(<LogoutButton />);

    await userEvent.click(screen.getByRole("button", { name: "Encerrar sessão" }));

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/login"));
    expect(mocks.signOut).toHaveBeenCalledWith(mocks.auth);
    expect(mocks.fetch).toHaveBeenCalledWith("/api/auth/session", { method: "DELETE" });
    expect(order).toEqual(["firebase", "server", "redirect"]);
  });

  it("tenta remover a sessão servidor mesmo se o logout Firebase falhar", async () => {
    mocks.signOut.mockRejectedValue(new Error("offline"));
    mocks.fetch.mockResolvedValue({ ok: true });
    render(<LogoutButton />);

    await userEvent.click(screen.getByRole("button", { name: "Encerrar sessão" }));

    await waitFor(() => expect(mocks.fetch).toHaveBeenCalledTimes(1));
    expect(mocks.replace).toHaveBeenCalledWith("/login");
  });

  it("não redireciona, informa a falha do servidor e permite tentar novamente", async () => {
    mocks.signOut.mockResolvedValue(undefined);
    mocks.fetch.mockResolvedValue({ ok: false });
    render(<LogoutButton />);

    await userEvent.click(screen.getByRole("button", { name: "Encerrar sessão" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível encerrar");
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Encerrar sessão" })).toBeEnabled();
  });
});

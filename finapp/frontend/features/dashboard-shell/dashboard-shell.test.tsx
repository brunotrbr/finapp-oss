import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DashboardShell } from "./dashboard-shell";

vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard/accounts" }));
vi.mock("@/features/auth/logout-button", () => ({
  LogoutButton: ({ menuItem = false }: { menuItem?: boolean }) => <button type="button" role={menuItem ? "menuitem" : undefined}>Encerrar sessão</button>,
}));

describe("DashboardShell", () => {
  it("expõe a navegação principal e identifica a rota ativa semanticamente", () => {
    render(<DashboardShell user={{ email: "ana@example.com", displayName: "Ana", photoURL: null }}><p>Conteúdo</p></DashboardShell>);
    expect(screen.getAllByRole("link", { name: "Contas" })).toHaveLength(2);
    screen.getAllByRole("link", { name: "Contas" }).forEach((link) => expect(link).toHaveAttribute("aria-current", "page"));
    expect(screen.getAllByRole("navigation", { name: "Navegação principal" })).toHaveLength(2);
    expect(screen.getByText("ana@example.com")).toBeInTheDocument();
  });

  it("abre o menu pelo ícone do usuário e expõe a ação de logout", async () => {
    const user = userEvent.setup();
    render(<DashboardShell user={{ email: "ana@example.com", displayName: "Ana", photoURL: null }}><p>Conteúdo</p></DashboardShell>);

    const trigger = screen.getByRole("button", { name: "Abrir menu do usuário" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("menuitem", { name: "Encerrar sessão" })).not.toBeInTheDocument();

    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menu", { name: "Menu do usuário" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Meu perfil" })).toHaveAttribute("href", "/dashboard/settings/profile");
    expect(screen.getByRole("menuitem", { name: "Encerrar sessão" })).toBeInTheDocument();
  });

  it("fecha o menu com Escape e devolve o foco ao ícone do usuário", async () => {
    const user = userEvent.setup();
    render(<DashboardShell user={{ email: "ana@example.com", displayName: "Ana", photoURL: null }}><p>Conteúdo</p></DashboardShell>);
    const trigger = screen.getByRole("button", { name: "Abrir menu do usuário" });

    await user.click(trigger);
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("menu", { name: "Menu do usuário" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});

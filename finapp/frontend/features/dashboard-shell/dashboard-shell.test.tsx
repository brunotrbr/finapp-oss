import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DashboardShell } from "./dashboard-shell";

vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard/accounts" }));

describe("DashboardShell", () => {
  it("expõe a navegação principal e identifica a rota ativa semanticamente", () => {
    render(<DashboardShell user={{ email: "ana@example.com", displayName: "Ana", photoURL: null }}><p>Conteúdo</p></DashboardShell>);
    expect(screen.getAllByRole("link", { name: "Contas" })).toHaveLength(2);
    screen.getAllByRole("link", { name: "Contas" }).forEach((link) => expect(link).toHaveAttribute("aria-current", "page"));
    expect(screen.getAllByRole("navigation", { name: "Navegação principal" })).toHaveLength(2);
    expect(screen.getByText("ana@example.com")).toBeInTheDocument();
  });
});

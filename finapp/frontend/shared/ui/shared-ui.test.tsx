import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfirmButton } from "./confirm-button";
import { Field } from "./field";
import { PageHeader } from "./page-header";

describe("ConfirmButton", () => {
  it("cancela sem agir e devolve foco ao acionador", () => {
    const confirm = vi.fn();
    render(<ConfirmButton label="Remover" title="Remover item?" onConfirm={confirm} />);
    const trigger = screen.getByRole("button", { name: "Remover" });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(confirm).not.toHaveBeenCalled();
    expect(trigger).toHaveFocus();
  });

  it("confirma uma única vez", () => {
    const confirm = vi.fn();
    render(<ConfirmButton label="Excluir" title="Excluir item?" onConfirm={confirm} />);
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(confirm).toHaveBeenCalledTimes(1);
  });

  it("mantém o foco no diálogo, fecha com Escape e torna o fundo inerte", async () => {
    const user = userEvent.setup();
    render(<><button>Fundo</button><ConfirmButton label="Remover" title="Remover item?" onConfirm={vi.fn()} /></>);
    const backgroundButton = screen.getByRole("button", { name: "Fundo" });
    const trigger = screen.getByRole("button", { name: "Remover" });
    await user.click(trigger);
    const cancel = screen.getByRole("button", { name: "Cancelar" });
    const confirm = screen.getByRole("button", { name: "Confirmar" });
    expect(backgroundButton.inert).toBe(true);
    expect(cancel).toHaveFocus();
    await user.tab({ shift: true });
    expect(confirm).toHaveFocus();
    await user.tab();
    expect(cancel).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});

describe("Field", () => {
  it("associa a mensagem ao controle e expõe o estado inválido", () => {
    render(<Field label="Valor" error="Informe um valor válido."><input /></Field>);
    const input = screen.getByLabelText("Valor");
    const alert = screen.getByRole("alert");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", alert.id);
    expect(alert.id).not.toBe("");
  });
});

describe("PageHeader", () => {
  it("expõe contexto visual sem perder a hierarquia do título", () => {
    render(<PageHeader eyebrow="Movimentação" title="Novo lançamento" description="Registre uma entrada ou saída." />);
    expect(screen.getByRole("heading", { level: 1, name: "Novo lançamento" })).toBeInTheDocument();
    expect(screen.getByText("Registre uma entrada ou saída.")).toHaveClass("text-muted");
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FinanceProvider } from "@/features/finance/model/finance-context";
import { AccountDetail } from "@/features/finance/accounts/account-detail";
import { BillDetail } from "@/features/finance/bills/bill-detail";
import { Overview } from "@/features/finance/overview/overview";
import { CardDetail } from "@/features/finance/cards/card-detail";
import { InvoiceScreen } from "@/features/finance/cards/invoice-screen";
import { PurchaseDetail } from "@/features/finance/purchases/purchase-detail";
import { TransactionForm } from "@/features/finance/transactions/transaction-form";
import { CategorySettings } from "@/features/settings/category-settings";
import { AccountDeletionSuccess } from "@/features/finance/accounts/account-deletion-success";
import { initialFinanceState } from "@/features/finance/model/demo-state";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), usePathname: () => "/dashboard" }));

describe("fluxos financeiros", () => {
  beforeEach(() => push.mockClear());

  it("inclui cartões em Minhas contas sem somar limite ao saldo", () => {
    render(<FinanceProvider><Overview /></FinanceProvider>);

    expect(screen.getByRole("link", { name: /Cartão principal/ })).toHaveAttribute("href", "/dashboard/cards/card-1");
    expect(screen.getByText("Cartão • fecha dia 20")).toBeInTheDocument();
    expect(screen.getByText("R$ 8.920,00")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Minhas contas" })).toBeInTheDocument();
    expect(screen.getByText("Saldo livre")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ações rápidas" })).toBeInTheDocument();
  });

  it("resume entradas, saídas e resultado no extrato", () => {
    render(<FinanceProvider><AccountDetail accountId="account-1" /></FinanceProvider>);
    expect(screen.getByText("Entradas")).toBeInTheDocument();
    expect(screen.getByText("Saídas")).toBeInTheDocument();
    expect(screen.getByText("Resultado líquido do período")).toBeInTheDocument();
    expect(screen.getAllByText("R$ 5.200,00").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("-R$ 1.880,00")).toBeInTheDocument();
  });

  it("expõe entrada e saída como opções de lançamento acessíveis", () => {
    render(<FinanceProvider><TransactionForm /></FinanceProvider>);
    const debit = screen.getByRole("radio", { name: "Saída" });
    const credit = screen.getByRole("radio", { name: "Entrada" });
    expect(debit).toBeChecked();
    expect(credit).not.toBeChecked();
    fireEvent.click(credit);
    expect(credit).toBeChecked();
  });

  it("não navega nem registra lançamento com categoria adulterada", () => {
    render(<FinanceProvider><TransactionForm /></FinanceProvider>);
    fireEvent.change(screen.getByLabelText("Valor (R$)"), { target: { value: "25" } });
    fireEvent.change(screen.getByLabelText("Descrição"), { target: { value: "Teste adulterado" } });
    fireEvent.change(screen.getByLabelText("Categoria"), { target: { value: "Categoria inexistente" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar lançamento" }));
    expect(screen.getByRole("alert")).toHaveTextContent("categoria válida");
    expect(push).not.toHaveBeenCalled();
  });

  it("cancelar pagamento não altera e confirmar recalcula os totais", () => {
    render(<FinanceProvider><BillDetail billId="bill-1" /><Overview /></FinanceProvider>);
    expect(screen.getByText("R$ 330,00")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Marcar paga" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByText("R$ 330,00")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Marcar paga" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(screen.getByText("R$ 210,00")).toBeInTheDocument();
  });

  it("bloqueia exclusão de conta ocupada com retorno acessível", () => {
    render(<FinanceProvider><AccountDetail accountId="account-1" /></FinanceProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Excluir conta" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Remova os lançamentos");
  });

  it("informa e bloqueia exclusão de conta que ainda possui pendências", () => {
    const state = { ...initialFinanceState, transactions: initialFinanceState.transactions.filter(({ accountId }) => accountId !== "account-1") };
    render(<FinanceProvider initialState={state}><AccountDetail accountId="account-1" /></FinanceProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Excluir conta" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(screen.getByRole("alert")).toHaveTextContent("pendências");
  });

  it("reclassifica vínculos antes de excluir uma conta e abre o sucesso", () => {
    render(<FinanceProvider><AccountDetail accountId="account-1" /><Overview /></FinanceProvider>);
    fireEvent.change(screen.getByLabelText("Conta de destino"), { target: { value: "account-2" } });
    fireEvent.click(screen.getByRole("button", { name: "Excluir conta" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(screen.queryByText("Conta principal")).not.toBeInTheDocument();
    expect(push).toHaveBeenCalledWith("/dashboard/accounts/deletion-success");
  });

  it("impede categoria duplicada ignorando caixa e espaços", () => {
    render(<FinanceProvider><CategorySettings /></FinanceProvider>);
    fireEvent.change(screen.getByLabelText("Nova categoria"), { target: { value: "  ALIMENTAÇÃO  " } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar categoria" }));
    expect(screen.getByRole("alert")).toHaveTextContent("já existe");
  });

  it("filtra categorias por uso em receitas e despesas", () => {
    render(<FinanceProvider><CategorySettings /></FinanceProvider>);
    expect(screen.getByRole("button", { name: /Todas/ })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: /Receitas/ }));
    expect(screen.getByText("Trabalho")).toBeInTheDocument();
    expect(screen.queryByText("Moradia")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Despesas/ }));
    expect(screen.getByText("Moradia")).toBeInTheDocument();
    expect(screen.queryByText("Trabalho")).not.toBeInTheDocument();
  });

  it("edita e exclui uma categoria com reclassificação", () => {
    render(<FinanceProvider><CategorySettings /></FinanceProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Editar Moradia" }));
    fireEvent.change(screen.getByLabelText("Nome da categoria"), { target: { value: "Casa" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar categoria" }));
    expect(screen.getByText("Casa")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Excluir Casa" }));
    fireEvent.change(screen.getByLabelText("Reclassificar como"), { target: { value: "Outros" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar exclusão" }));
    expect(screen.queryByText("Casa")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Categoria excluída");
  });

  it("associa erros de edição e exclusão aos respectivos campos", () => {
    render(<FinanceProvider><CategorySettings /></FinanceProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Editar Moradia" }));
    const edit = screen.getByLabelText("Nome da categoria");
    fireEvent.change(edit, { target: { value: "Alimentação" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar categoria" }));
    expect(edit).toHaveAttribute("aria-invalid", "true");
    expect(edit.getAttribute("aria-describedby")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Cancelar edição" }));
    fireEvent.click(screen.getByRole("button", { name: "Excluir Moradia" }));
    const destination = screen.getByLabelText("Reclassificar como");
    fireEvent.click(screen.getByRole("button", { name: "Confirmar exclusão" }));
    expect(destination).toHaveAttribute("aria-invalid", "true");
    expect(destination.getAttribute("aria-describedby")).toBeTruthy();
    expect(screen.getByLabelText("Nova categoria")).not.toHaveAttribute("aria-invalid", "true");
  });

  it("protege a categoria Outros contra edição e exclusão", () => {
    render(<FinanceProvider><CategorySettings /></FinanceProvider>);
    expect(screen.queryByRole("button", { name: "Editar Outros" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Excluir Outros" })).not.toBeInTheDocument();
    expect(screen.getByText("Categoria do sistema")).toBeInTheDocument();
  });

  it("exibe a fatura derivada e bloqueia pagamento duplicado", () => {
    render(<FinanceProvider><InvoiceScreen cardId="card-1" /></FinanceProvider>);
    expect(screen.getAllByText("R$ 300,00")).toHaveLength(2);
    expect(screen.getByText("Parcela 1 de 3")).toBeInTheDocument();
    expect(screen.getByText("Fatura atual")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Adicionar compra" })).toHaveAttribute("href", "/dashboard/cards/card-1/purchases/new");
    fireEvent.change(screen.getByLabelText("Conta para pagamento"), { target: { value: "account-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Pagar fatura" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(screen.getByRole("status")).toHaveTextContent("Fatura paga");
    expect(screen.getByRole("button", { name: "Fatura paga" })).toBeDisabled();
  });

  it("não oferece pagamento nem anuncia sucesso para fatura vazia", () => {
    render(<FinanceProvider initialState={{ ...initialFinanceState, purchases: [] }}><InvoiceScreen cardId="card-1" /></FinanceProvider>);
    expect(screen.getByText("Nenhum lançamento neste ciclo.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Pagar fatura" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Fatura paga/)).not.toBeInTheDocument();
  });

  it("mostra sucesso de exclusão apenas quando há resultado validado", () => {
    const { rerender } = render(<FinanceProvider><AccountDeletionSuccess /></FinanceProvider>);
    expect(screen.queryByRole("heading", { name: "Conta excluída" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Nenhuma exclusão recente" })).toBeInTheDocument();

    rerender(<FinanceProvider key="with-result" initialState={{ ...initialFinanceState, accountDeletionResult: { accountName: "Conta principal", destinationName: "Reserva", reclassified: true, transactionCount: 3, billCount: 1, transferredInitialBalance: 3200 } }}><AccountDeletionSuccess /></FinanceProvider>);
    expect(screen.getByRole("heading", { name: "Conta excluída" })).toBeInTheDocument();
    expect(screen.getByText(/reclassificados para Reserva/)).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("R$ 3.200,00")).toBeInTheDocument();
  });

  it("remove uma compra confirmada e atualiza o cartão", () => {
    render(<FinanceProvider><PurchaseDetail purchaseId="purchase-1" /><CardDetail cardId="card-1" /></FinanceProvider>);
    expect(screen.getAllByText("Notebook")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Excluir compra" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(screen.queryByText("Notebook")).not.toBeInTheDocument();
    expect(screen.getByText("Nenhuma compra neste cartão.")).toBeInTheDocument();
    expect(push).toHaveBeenCalledWith("/dashboard/cards/card-1");
  });
});

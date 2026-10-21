import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FinanceProvider } from "@/features/finance/model/finance-context";
import { AccountDetail } from "@/features/finance/accounts/account-detail";
import { BillDetail } from "@/features/finance/bills/bill-detail";
import { Overview } from "@/features/finance/overview/overview";
import { CardDetail } from "@/features/finance/cards/card-detail";
import { PurchaseDetail } from "@/features/finance/purchases/purchase-detail";
import { TransactionForm } from "@/features/finance/transactions/transaction-form";
import { CategorySettings } from "@/features/settings/category-settings";
import { initialFinanceState } from "@/features/finance/model/demo-state";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), usePathname: () => "/dashboard" }));

describe("fluxos financeiros", () => {
  it("expõe entrada e saída como opções de lançamento acessíveis", () => {
    render(<FinanceProvider><TransactionForm /></FinanceProvider>);
    const debit = screen.getByRole("radio", { name: "Saída" });
    const credit = screen.getByRole("radio", { name: "Entrada" });
    expect(debit).toBeChecked();
    expect(credit).not.toBeChecked();
    fireEvent.click(credit);
    expect(credit).toBeChecked();
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

  it("impede categoria duplicada ignorando caixa e espaços", () => {
    render(<FinanceProvider><CategorySettings /></FinanceProvider>);
    fireEvent.change(screen.getByLabelText("Nova categoria"), { target: { value: "  ALIMENTAÇÃO  " } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar categoria" }));
    expect(screen.getByRole("alert")).toHaveTextContent("já existe");
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

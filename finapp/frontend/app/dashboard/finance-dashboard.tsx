"use client";
import { useState } from "react";
import { UserMenu } from "./user-menu";
import { DashboardNavigation, type DashboardCategory } from "./dashboard-navigation";
import {
  formatBRL,
  accountRecordKey,
  getAccountOverview,
  type FinanceAccount,
  type PendingBill,
} from "@/lib/finance-data";

type Tab = "pendentes" | "proximas" | "lancamentos";

const tabs: { id: Tab; label: string }[] = [
  { id: "pendentes", label: "Pendentes" },
  { id: "proximas", label: "Próximas" },
  { id: "lancamentos", label: "Lançamentos" },
];

type DashboardIdentity = {
  initials: string;
  userLabel: string;
  headerDate: string;
};

export function FinanceDashboard({ initials, userLabel, headerDate, accounts }: DashboardIdentity & { accounts: FinanceAccount[] }) {
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<Tab>("pendentes");
  const [selectedCategory, setSelectedCategory] = useState<DashboardCategory>("resumo");
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const summary = getAccountOverview(accounts, selectedAccountId);
  const { monthBillsTotal, upcomingBills, recentTransactions } = summary;

  const pending = summary.pendingBills.filter((bill) =>
    !confirmedIds.has(accountRecordKey(bill.accountId, bill.id)));

  const confirmBill = (bill: PendingBill & { accountId: string }) => {
    setConfirmedIds((prev) => new Set(prev).add(accountRecordKey(bill.accountId, bill.id)));
  };

  function navigateToCategory(category: DashboardCategory) {
    setSelectedCategory(category);
    if (category === "pendentes" || category === "proximas" || category === "lancamentos") {
      setActiveTab(category);
    }
    const target = category === "resumo" ? "finance-summary"
      : category === "contas" ? "finance-account" : "finance-section";
    requestAnimationFrame(() => {
      const element = document.getElementById(target);
      element?.scrollIntoView({ block: "start" });
      element?.focus({ preventScroll: true });
    });
  }

  return (
    <main lang="pt-BR" className="min-h-dvh w-full bg-paper text-ink">
      <div className="flex min-h-dvh w-full min-w-0 flex-col">
        <Header initials={initials} userLabel={userLabel} headerDate={headerDate} accountName={summary.name} selectedCategory={selectedCategory} onNavigate={navigateToCategory} />

        <div className="px-5 pb-4 sm:px-8 sm:pb-6 xl:px-12">
          <div className="w-full sm:max-w-sm">
          <label htmlFor="finance-account" className="mb-1.5 block text-[11px] tracking-[0.12em] text-caderno-muted uppercase">
            Conta
          </label>
          <select
            id="finance-account"
            value={selectedAccountId ?? ""}
            onChange={(event) => setSelectedAccountId(event.target.value || null)}
            className="min-h-11 w-full min-w-0 rounded-[12px] bg-paper-deep px-3 py-2 text-[14px] font-medium text-royal ring-1 ring-ink/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-mid"
          >
            <option value="">todas contas</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>{account.name}</option>
            ))}
          </select>
          </div>
        </div>

        {/* Resumo */}
        <section id="finance-summary" aria-label="Resumo financeiro" tabIndex={-1} className="grid min-w-0 scroll-mt-5 gap-3 px-5 sm:gap-4 sm:px-8 md:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)] xl:px-12">
          <div className="relative min-w-0 overflow-hidden rounded-[18px] bg-royal-deep p-5 ring-1 ring-ink/10 lg:p-6">
            <div className="pointer-events-none absolute top-0 right-0 size-44 rounded-full bg-gold/15 blur-2xl" />
            <p className="relative text-[11px] tracking-[0.2em] text-gold-bright/80 uppercase">
              Saldo total
            </p>
            <p className="relative mt-2 font-caderno-mono text-[clamp(24px,7vw,32px)] leading-none font-medium text-paper xl:text-[40px]">
              {formatBRL(summary.totalBalance)}
            </p>
            <div className="relative mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-paper/60">
              <span>
                <span className="text-gold-bright">
                  {summary.monthChange >= 0 ? "+" : "−"}{formatBRL(Math.abs(summary.monthChange))}
                </span>{" "}
                este mês
              </span>
              <span className="text-paper/30">·</span>
              <span>{summary.activeBillsCount} contas ativas</span>
            </div>
          </div>

          <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4">
            <div className="flex min-w-0 flex-col justify-center rounded-[14px] bg-paper-deep p-4 ring-1 ring-ink/5 lg:p-6">
              <p className="text-[11px] tracking-[0.12em] text-caderno-muted uppercase">
                Contas do mês
              </p>
              <p className="mt-1 font-caderno-mono text-[clamp(14px,4vw,19px)] font-medium text-ink xl:text-[24px]">
                {formatBRL(monthBillsTotal)}
              </p>
            </div>
            <div className="flex min-w-0 flex-col justify-center rounded-[14px] bg-paper-deep p-4 ring-1 ring-ink/5 lg:p-6">
              <p className="text-[11px] tracking-[0.12em] text-caderno-muted uppercase">
                Saldo livre
              </p>
              <p className="mt-1 font-caderno-mono text-[clamp(14px,4vw,19px)] font-medium text-royal xl:text-[24px]">
                {formatBRL(summary.freeBalance)}
              </p>
            </div>
          </div>
        </section>

        {/* Tabela com abas */}
        <section id="finance-section" aria-label="Contas e lançamentos" tabIndex={-1} className="mt-8 min-w-0 scroll-mt-5 px-5 pb-10 sm:px-8 xl:px-12">
          {/* Abas */}
          <div className="mb-3 grid grid-cols-3 gap-1 rounded-[12px] bg-paper-deep p-1 ring-1 ring-ink/5 md:max-w-xl">
            {tabs.map((tab) => (
              <button
                type="button"
                aria-pressed={activeTab === tab.id}
                aria-controls="finance-panel"
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSelectedCategory(tab.id);
                }}
                className={
                  "min-h-11 rounded-[9px] py-2 text-[12px] font-medium tracking-tight transition-colors " +
                  (activeTab === tab.id
                    ? "bg-royal text-paper ring-1 ring-ink/10 shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
                    : "text-caderno-muted hover:text-ink")
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Cabeçalho da aba ativa */}
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-[15px] font-semibold tracking-tight">
              {activeTab === "pendentes"
                ? "Atrasadas / pendentes"
                : activeTab === "proximas"
                  ? "Próximas contas"
                  : "Últimos lançamentos"}
            </h2>
            <span className="text-[11px] text-caderno-muted">
              {activeTab === "pendentes" && `${pending.length} contas`}
              {activeTab === "proximas" && `${upcomingBills.length} contas`}
              {activeTab === "lancamentos" && "Hoje"}
            </span>
          </div>

          {/* Tabela */}
          <div id="finance-panel" className="overflow-hidden rounded-[14px] bg-paper-deep ring-1 ring-ink/5">
            {/* Aba: Atrasadas / pendentes */}
            {activeTab === "pendentes" &&
              (pending.length === 0 ? (
                <div className="p-4 text-[13px] text-caderno-muted">
                  Tudo em dia — nenhuma conta pendente.
                </div>
              ) : (
                pending.map((bill, i) => (
                  <div
                    key={accountRecordKey(bill.accountId, bill.id)}
                    className={
                      "grid grid-cols-[6px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 p-3.5 min-[400px]:flex" +
                      (i < pending.length - 1
                        ? " border-b border-paper-line"
                        : "")
                    }
                  >
                    <div className="size-1.5 shrink-0 rounded-full bg-gold" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium text-ink">
                        {bill.name}
                      </p>
                      <p className="mt-0.5 text-[11px] text-caderno-muted">
                        {bill.dueLabel} · {bill.category}
                      </p>
                    </div>
                    <p className="shrink-0 font-caderno-mono text-[13px] text-caderno-muted">
                      {formatBRL(bill.amount)}
                    </p>
                    <button
                      type="button"
                      aria-label={`Confirmar pagamento de ${bill.name}`}
                      onClick={() => confirmBill(bill)}
                      className="col-span-2 col-start-2 min-h-11 shrink-0 justify-self-end rounded-[8px] bg-royal px-3 py-2 text-[12px] font-medium text-paper ring-1 ring-ink/10 transition-colors hover:bg-royal-mid active:scale-[0.98]"
                    >
                      Confirmar
                    </button>
                  </div>
                ))
              ))}

            {/* Aba: Próximas contas */}
            {activeTab === "proximas" &&
              upcomingBills.length === 0 && (
                <div className="p-4 text-[13px] text-caderno-muted">Nenhuma próxima conta.</div>
              )}
            {activeTab === "proximas" &&
              upcomingBills.map((bill, i) => (
                <div
                  key={accountRecordKey(bill.accountId, bill.id)}
                  className={
                    "flex items-center gap-3 p-3.5" +
                    (i < upcomingBills.length - 1
                      ? " border-b border-paper-line"
                      : "")
                  }
                >
                  <span className="w-[52px] shrink-0 text-[11px] font-medium tracking-[0.1em] text-royal uppercase">
                    {bill.daysAhead} {bill.daysAhead === 1 ? "dia" : "dias"}
                  </span>
                  <p className="flex-1 truncate text-[14px] font-medium text-ink">
                    {bill.name}
                  </p>
                  <p className="shrink-0 font-caderno-mono text-[13px] text-caderno-muted">
                    {formatBRL(bill.amount)}
                  </p>
                </div>
              ))}

            {/* Aba: Últimos lançamentos */}
            {activeTab === "lancamentos" &&
              recentTransactions.length === 0 && (
                <div className="p-4 text-[13px] text-caderno-muted">Nenhum lançamento nesta conta.</div>
              )}
            {activeTab === "lancamentos" &&
              recentTransactions.map((t, i) => {
                const isCredit = t.amount > 0;
                return (
                  <div
                    key={accountRecordKey(t.accountId, t.id)}
                    className={
                      "flex items-center gap-3 p-3.5" +
                      (i < recentTransactions.length - 1
                        ? " border-b border-paper-line"
                        : "")
                    }
                  >
                    <div
                      className={
                        "grid size-8 shrink-0 place-items-center rounded-[8px] bg-paper text-[12px] font-semibold ring-1 ring-ink/5 " +
                        (isCredit ? "text-gold" : "text-royal")
                      }
                    >
                      {t.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium text-ink">
                        {t.name}
                      </p>
                      <p className="mt-0.5 text-[11px] text-caderno-muted">
                        {t.dateLabel}
                        {t.timeLabel ? ` · ${t.timeLabel}` : ""} · {t.category}
                      </p>
                    </div>
                    <p
                      className={
                        "shrink-0 font-caderno-mono text-[13px] font-medium " +
                        (isCredit ? "text-royal" : "text-ink")
                      }
                    >
                      {isCredit ? "+" : "−"}
                      {formatBRL(Math.abs(t.amount))}
                    </p>
                  </div>
                );
              })}
          </div>
        </section>
        <footer className="mt-auto px-5 pb-8 sm:px-8 xl:px-12">
          <p className="text-[11px] text-caderno-muted">Dados de demonstração</p>
        </footer>
      </div>
    </main>
  );
}

function Header({ initials, userLabel, headerDate, accountName, selectedCategory, onNavigate }: DashboardIdentity & {
  accountName: string;
  selectedCategory: DashboardCategory;
  onNavigate: (category: DashboardCategory) => void;
}) {
  return (
    <header className="flex items-center justify-between px-5 pt-6 pb-4 sm:px-8 sm:pt-8 sm:pb-6 xl:px-12">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-[9px] bg-royal ring-1 ring-ink/10">
          <span className="font-caderno-display text-[15px] font-semibold text-gold-bright">
            C
          </span>
        </div>
        <div className="min-w-0">
          <h1 title={accountName} className="truncate text-[15px] leading-none font-semibold tracking-tight sm:text-[18px]">
            {accountName}
          </h1>
          <p className="mt-1 text-[11px] text-caderno-muted">
            {headerDate}
          </p>
        </div>
      </div>
      <div className="ml-3 flex shrink-0 items-center gap-2">
        <DashboardNavigation selectedCategory={selectedCategory} onNavigate={onNavigate} />
        <UserMenu initials={initials} userLabel={userLabel} />
      </div>
    </header>
  );
}

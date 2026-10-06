"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./dashboard.module.css";

export type DashboardCategory = "resumo" | "contas" | "pendentes" | "proximas" | "lancamentos";

const categories: { id: DashboardCategory; label: string; description: string }[] = [
  { id: "resumo", label: "Visão geral", description: "Saldos e resumo do mês" },
  { id: "contas", label: "Minhas contas", description: "Escolha a conta que deseja consultar" },
  { id: "pendentes", label: "Pendentes", description: "Contas atrasadas e a pagar" },
  { id: "proximas", label: "Próximas contas", description: "Veja os próximos vencimentos" },
  { id: "lancamentos", label: "Lançamentos", description: "Entradas e saídas recentes" },
];

export function DashboardNavigation({ selectedCategory, onNavigate }: {
  selectedCategory: DashboardCategory;
  onNavigate: (category: DashboardCategory) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);

  function close() {
    dialogRef.current?.close();
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Abrir menu de navegação"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="dashboard-navigation"
        onClick={() => {
          dialogRef.current?.showModal();
          setOpen(true);
        }}
        className="grid size-11 shrink-0 place-items-center rounded-[10px] bg-paper-deep text-royal ring-1 ring-ink/5 transition-colors hover:bg-paper-line"
      >
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <dialog
        ref={dialogRef}
        id="dashboard-navigation"
        aria-labelledby="navigation-title"
        className={styles.navigationDialog}
        onClose={() => {
          setOpen(false);
          triggerRef.current?.focus();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className="flex min-h-full flex-col p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-caderno-display text-[13px] text-gold">Caderno</p>
              <h2 id="navigation-title" className="mt-1 text-lg font-semibold text-ink">Menu</h2>
            </div>
            <button
              type="button"
              aria-label="Fechar menu de navegação"
              onClick={close}
              className="grid size-11 place-items-center rounded-[10px] bg-paper text-royal ring-1 ring-ink/5 transition-colors hover:bg-paper-line"
            >
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            </button>
          </div>

          <nav aria-label="Categorias do aplicativo" className="mt-8 flex flex-col gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                aria-current={selectedCategory === category.id ? "location" : undefined}
                onClick={() => {
                  close();
                  onNavigate(category.id);
                }}
                className={"flex min-h-16 items-center justify-between gap-3 rounded-[12px] px-4 py-3 text-left transition-colors " +
                  (selectedCategory === category.id
                    ? "bg-royal text-paper ring-1 ring-ink/10"
                    : "text-ink hover:bg-paper ring-1 ring-transparent")}
              >
                <span>
                  <span className="block text-[14px] font-medium">{category.label}</span>
                  <span className={"mt-1 block text-[11px] " + (selectedCategory === category.id ? "text-paper/70" : "text-caderno-muted")}>
                    {category.description}
                  </span>
                </span>
                <svg aria-hidden="true" className="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 5 7 7-7 7" />
                </svg>
              </button>
            ))}
          </nav>
        </div>
      </dialog>
    </>
  );
}

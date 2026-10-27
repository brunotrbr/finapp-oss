"use client";

import { useState } from "react";
import { SYSTEM_PAYMENT_CATEGORY } from "@/domain/finance/finance-reducer";
import { categoryError } from "@/domain/finance/validation";
import { useFinance } from "@/features/finance/model/finance-context";
import { Card } from "@/shared/ui/card";
import { Field } from "@/shared/ui/field";
import { PageHeader } from "@/shared/ui/page-header";
import { buttonClass, dangerButtonClass, formCardClass, inputClass, secondaryButtonClass } from "@/shared/ui/styles";

type Filter = "all" | "expense" | "income";

export function CategorySettings() {
  const { state, dispatch } = useFinance();
  const [filter, setFilter] = useState<Filter>("all");
  const [createError, setCreateError] = useState("");
  const [editError, setEditError] = useState("");
  const [removeError, setRemoveError] = useState("");
  const [value, setValue] = useState("");
  const [editing, setEditing] = useState("");
  const [editValue, setEditValue] = useState("");
  const [removing, setRemoving] = useState("");
  const [destination, setDestination] = useState("");
  const [message, setMessage] = useState("");

  const tone = (category: string) => state.transactions.some((transaction) => transaction.category === category && transaction.amount > 0) ? "income" : "expense";
  const visibleCategories = state.categories.filter((category) => filter === "all" || tone(category) === filter);
  const linkedCount = state.transactions.filter((transaction) => state.categories.includes(transaction.category)).length;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = categoryError(value, state.categories);
    if (validation) { setCreateError(validation); return; }
    dispatch({ type: "category/add", name: value });
    setValue(""); setCreateError(""); setMessage("Categoria adicionada.");
  }
  function saveEdit() {
    const validation = categoryError(editValue, state.categories.filter((category) => category !== editing));
    if (validation) { setEditError(validation); return; }
    dispatch({ type: "category/edit", currentName: editing, name: editValue });
    setEditing(""); setEditError(""); setMessage("Categoria atualizada.");
  }
  function remove() {
    if (!destination) { setRemoveError("Selecione uma categoria de destino."); return; }
    dispatch({ type: "category/remove-and-reclassify", name: removing, destinationName: destination });
    setRemoving(""); setDestination(""); setRemoveError(""); setMessage("Categoria excluída e lançamentos reclassificados.");
  }

  const tab = (value: Filter, label: string) => <button type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={`min-h-11 flex-1 rounded-xl px-3 text-sm font-semibold transition ${filter === value ? "bg-surface text-primary shadow-sm ring-1 ring-primary/15" : "text-muted hover:text-foreground"}`}>{label}</button>;

  return <div className="space-y-6">
    <PageHeader title="Categorias Ativas" eyebrow="Gestão inteligente" description="Organize receitas e despesas sem perder o histórico dos lançamentos." />
    {message && <p role="status" className="rounded-xl bg-primary-container p-3 text-sm text-on-primary-container">{message}</p>}
    <div className="flex rounded-2xl bg-surface-strong/70 p-1.5" aria-label="Filtrar categorias">{tab("all", `Todas (${state.categories.length})`)}{tab("expense", "Despesas")}{tab("income", "Receitas")}</div>
    <Card className="flex items-center justify-between gap-4 bg-surface-subtle"><span className="text-sm">Total de lançamentos vinculados</span><strong className="text-lg text-secondary">{linkedCount} transações</strong></Card>
    <ul className="grid gap-3">{visibleCategories.map((category, index) => <li className="rounded-2xl border border-border-subtle bg-surface p-4 shadow-[0_8px_24px_-22px_rgba(15,118,110,0.5)]" key={category}>
      {editing === category ? <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end"><Field label="Nome da categoria" error={editError}><input className={inputClass} value={editValue} onChange={(event) => { setEditValue(event.target.value); setEditError(""); }} /></Field><button type="button" className={secondaryButtonClass} onClick={() => { setEditing(""); setEditError(""); }}>Cancelar edição</button><button type="button" className={buttonClass} onClick={saveEdit}>Salvar categoria</button></div>
      : removing === category ? <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end"><Field label="Reclassificar como" error={removeError}><select className={inputClass} value={destination} onChange={(event) => { setDestination(event.target.value); setRemoveError(""); }}><option value="">Selecione</option>{state.categories.filter((item) => item !== category).map((item) => <option key={item}>{item}</option>)}</select></Field><button type="button" className={secondaryButtonClass} onClick={() => { setRemoving(""); setRemoveError(""); }}>Cancelar</button><button type="button" className={dangerButtonClass} onClick={remove}>Confirmar exclusão</button></div>
      : <div className="flex min-h-14 flex-wrap items-center gap-3"><span className={`grid size-12 place-items-center rounded-2xl text-lg font-bold ${index % 2 === 0 ? "bg-primary-container text-primary" : "bg-secondary-container text-secondary"}`} aria-hidden>{category.slice(0, 1)}</span><span className="min-w-28 flex-1"><strong className="block">{category}</strong><span className="mt-1 block text-xs text-muted">{state.transactions.filter((transaction) => transaction.category === category).length} lançamentos • {tone(category) === "income" ? "Receita" : "Despesa"}</span></span>{category === SYSTEM_PAYMENT_CATEGORY ? <span className="rounded-full bg-primary-container px-3 py-1 text-xs font-semibold text-on-primary-container">Categoria do sistema</span> : <><button type="button" className={secondaryButtonClass} aria-label={`Editar ${category}`} onClick={() => { setEditing(category); setEditValue(category); setEditError(""); setRemoving(""); }}>Editar</button><button type="button" className={dangerButtonClass} aria-label={`Excluir ${category}`} onClick={() => { setRemoving(category); setDestination(""); setRemoveError(""); setEditing(""); }}>Excluir</button></>}</div>}
    </li>)}</ul>
    <form onSubmit={submit} className={formCardClass}><Field label="Nova categoria" error={createError}><input className={inputClass} value={value} onChange={(event) => { setValue(event.target.value); setCreateError(""); }} required /></Field><button className={`${buttonClass} w-full`}>Adicionar categoria</button></form>
    <Card className="border-warning/25 bg-warning-container/45"><h2 className="font-bold text-warning">Exclusão com proteção de histórico</h2><p className="mt-2 text-sm leading-6 text-muted">Categorias usadas em lançamentos exigem reclassificação para preservar a integridade financeira.</p></Card>
  </div>;
}

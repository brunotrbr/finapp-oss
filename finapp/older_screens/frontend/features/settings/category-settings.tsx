"use client";

import { useState } from "react";
import { categoryError } from "@/domain/finance/validation";
import { SYSTEM_PAYMENT_CATEGORY } from "@/domain/finance/finance-reducer";
import { useFinance } from "@/features/finance/model/finance-context";
import { Card } from "@/shared/ui/card";
import { Field } from "@/shared/ui/field";
import { PageHeader } from "@/shared/ui/page-header";
import { buttonClass, dangerButtonClass, formCardClass, inputClass, secondaryButtonClass } from "@/shared/ui/styles";

export function CategorySettings() {
  const { state, dispatch } = useFinance();
  const [createError, setCreateError] = useState("");
  const [editError, setEditError] = useState("");
  const [removeError, setRemoveError] = useState("");
  const [value, setValue] = useState("");
  const [editing, setEditing] = useState("");
  const [editValue, setEditValue] = useState("");
  const [removing, setRemoving] = useState("");
  const [destination, setDestination] = useState("");
  const [message, setMessage] = useState("");
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = categoryError(value, state.categories);
    if (validation) { setCreateError(validation); return; }
    dispatch({ type: "category/add", name: value });
    setValue("");
    setCreateError("");
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
  return <div className="space-y-6"><PageHeader title="Categorias" eyebrow="Organização" />{message && <p role="status" className="rounded-xl bg-primary-container p-3 text-sm text-on-primary-container">{message}</p>}<Card><div className="mb-4 flex items-center justify-between"><p className="text-sm text-muted">Categorias ativas</p><span className="rounded-full bg-secondary-container px-3 py-1 text-xs font-bold text-secondary">{state.categories.length}</span></div><ul className="grid gap-3">{state.categories.map((category, index) => <li className="rounded-xl border border-border-subtle bg-surface-subtle p-3" key={category}>{editing === category ? <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end"><Field label="Nome da categoria" error={editError}><input className={inputClass} value={editValue} onChange={(event) => { setEditValue(event.target.value); setEditError(""); }} /></Field><button type="button" className={secondaryButtonClass} onClick={() => { setEditing(""); setEditError(""); }}>Cancelar edição</button><button type="button" className={buttonClass} onClick={saveEdit}>Salvar categoria</button></div> : removing === category ? <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end"><Field label="Reclassificar como" error={removeError}><select className={inputClass} value={destination} onChange={(event) => { setDestination(event.target.value); setRemoveError(""); }}><option value="">Selecione</option>{state.categories.filter((item) => item !== category).map((item) => <option key={item}>{item}</option>)}</select></Field><button type="button" className={secondaryButtonClass} onClick={() => { setRemoving(""); setRemoveError(""); }}>Cancelar</button><button type="button" className={dangerButtonClass} onClick={remove}>Confirmar exclusão</button></div> : <div className="flex min-h-11 flex-wrap items-center gap-3"><span className={`size-2.5 rounded-full ${index % 2 === 0 ? "bg-primary" : "bg-secondary"}`} aria-hidden /><span className="min-w-28 flex-1 text-sm font-semibold">{category}</span>{category === SYSTEM_PAYMENT_CATEGORY ? <span className="rounded-full bg-primary-container px-3 py-1 text-xs font-semibold text-on-primary-container">Categoria do sistema</span> : <><button type="button" className={secondaryButtonClass} aria-label={`Editar ${category}`} onClick={() => { setEditing(category); setEditValue(category); setEditError(""); setRemoving(""); setRemoveError(""); }}>Editar</button><button type="button" className={dangerButtonClass} aria-label={`Excluir ${category}`} onClick={() => { setRemoving(category); setDestination(""); setRemoveError(""); setEditing(""); setEditError(""); }}>Excluir</button></>}</div>}</li>)}</ul></Card><form onSubmit={submit} className={formCardClass}><Field label="Nova categoria" error={createError}><input className={inputClass} value={value} onChange={(event) => { setValue(event.target.value); setCreateError(""); }} required /></Field><button className={`${buttonClass} w-full`}>Adicionar categoria</button></form></div>;
}

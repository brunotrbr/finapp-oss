"use client";

import { useState } from "react";
import { categoryError } from "@/domain/finance/validation";
import { useFinance } from "@/features/finance/model/finance-context";
import { Card } from "@/shared/ui/card";
import { Field } from "@/shared/ui/field";
import { PageHeader } from "@/shared/ui/page-header";
import { buttonClass, formCardClass, inputClass } from "@/shared/ui/styles";

export function CategorySettings() {
  const { state, dispatch } = useFinance();
  const [error, setError] = useState("");
  const [value, setValue] = useState("");
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = categoryError(value, state.categories);
    if (validation) { setError(validation); return; }
    dispatch({ type: "category/add", name: value });
    setValue("");
    setError("");
  }
  return <div className="space-y-6"><PageHeader title="Categorias" eyebrow="Organização" /><Card><div className="mb-4 flex items-center justify-between"><p className="text-sm text-muted">Categorias ativas</p><span className="rounded-full bg-secondary-container px-3 py-1 text-xs font-bold text-secondary">{state.categories.length}</span></div><ul className="grid gap-3 sm:grid-cols-2">{state.categories.map((category, index) => <li className="flex min-h-14 items-center gap-3 rounded-xl border border-border-subtle bg-surface-subtle px-4 text-sm font-semibold" key={category}><span className={`size-2.5 rounded-full ${index % 2 === 0 ? "bg-primary" : "bg-secondary"}`} aria-hidden />{category}</li>)}</ul></Card><form onSubmit={submit} className={formCardClass}><Field label="Nova categoria" error={error}><input className={inputClass} value={value} onChange={(event) => setValue(event.target.value)} required /></Field><button className={`${buttonClass} w-full`}>Adicionar categoria</button></form></div>;
}

"use client";

import { useState } from "react";
import { categoryError } from "@/domain/finance/validation";
import { useFinance } from "@/features/finance/model/finance-context";
import { Card } from "@/shared/ui/card";
import { Field } from "@/shared/ui/field";
import { PageHeader } from "@/shared/ui/page-header";
import { buttonClass, inputClass } from "@/shared/ui/styles";

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
  return <div className="space-y-6"><PageHeader title="Categorias" /><Card><ul className="divide-y divide-zinc-100 dark:divide-zinc-800">{state.categories.map((category) => <li className="py-3 text-sm" key={category}>{category}</li>)}</ul></Card><form onSubmit={submit} className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"><Field label="Nova categoria" error={error}><input className={inputClass} value={value} onChange={(event) => setValue(event.target.value)} required /></Field><button className={buttonClass}>Adicionar categoria</button></form></div>;
}

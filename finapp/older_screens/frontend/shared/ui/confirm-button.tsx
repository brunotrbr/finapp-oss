"use client";

import { useEffect, useId, useRef, useState } from "react";
import { buttonClass, dangerButtonClass, secondaryButtonClass } from "./styles";

export function ConfirmButton({ label, title, description = "Esta ação não poderá ser desfeita.", onConfirm, danger = true }: { label: string; title: string; description?: string; onConfirm: () => void; danger?: boolean }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    if (!open) {
      if (wasOpen.current) triggerRef.current?.focus();
      return;
    }
    wasOpen.current = true;
    const background: HTMLElement[] = [];
    let branch: HTMLElement | null = dialogRef.current;
    while (branch?.parentElement) {
      const parent: HTMLElement = branch.parentElement;
      background.push(...Array.from(parent.children).filter((element): element is HTMLElement => element !== branch && element instanceof HTMLElement));
      if (parent === document.body) break;
      branch = parent;
    }
    const previous = background.map((element) => ({ element, inert: element.inert, ariaHidden: element.getAttribute("aria-hidden") }));
    background.forEach((element) => { element.inert = true; element.setAttribute("aria-hidden", "true"); });
    queueMicrotask(() => cancelRef.current?.focus());
    return () => {
      previous.forEach(({ element, inert, ariaHidden }) => {
        element.inert = inert;
        if (ariaHidden === null) element.removeAttribute("aria-hidden"); else element.setAttribute("aria-hidden", ariaHidden);
      });
    };
  }, [open]);
  const close = () => setOpen(false);
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") { event.preventDefault(); close(); return; }
    if (event.key !== "Tab") return;
    const first = cancelRef.current;
    const last = confirmRef.current;
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };
  const dialog = open ? <div ref={dialogRef} className="fixed inset-0 z-50 grid place-items-center bg-foreground/60 p-4 backdrop-blur-sm" role="presentation"><div role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} onKeyDown={handleKeyDown} className="w-full max-w-sm rounded-3xl border border-border-subtle bg-surface p-6 text-foreground shadow-2xl"><div className={`mb-4 grid size-11 place-items-center rounded-full ${danger ? "bg-expense-container text-expense" : "bg-primary-container text-primary"}`} aria-hidden>{danger ? "!" : "✓"}</div><h2 id={titleId} className="text-xl font-bold tracking-tight">{title}</h2><p id={descriptionId} className="mt-2 text-sm leading-6 text-muted">{description}</p><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button ref={cancelRef} type="button" className={secondaryButtonClass} onClick={close}>Cancelar</button><button ref={confirmRef} type="button" className={danger ? dangerButtonClass : buttonClass} onClick={() => { onConfirm(); close(); }}>Confirmar</button></div></div></div> : null;
  return <><button ref={triggerRef} type="button" className={danger ? dangerButtonClass : buttonClass} onClick={() => setOpen(true)}>{label}</button>{dialog}</>;
}

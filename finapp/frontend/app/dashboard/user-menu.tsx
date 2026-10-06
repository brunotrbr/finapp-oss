"use client";

import { useEffect, useRef, useState } from "react";
import { LogoutButton } from "./logout-button";

export function UserMenu({ initials, userLabel }: { initials: string; userLabel: string }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"profile" | "settings">("profile");
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    function dismiss(event: PointerEvent) {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);

  function showView(nextView: "profile" | "settings") {
    setView(nextView);
    setOpen(false);
    dialogRef.current?.showModal();
  }

  return (
    <div
      ref={containerRef}
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        title={userLabel}
        aria-label={`Abrir menu do usuário: ${userLabel}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="user-menu"
        onClick={() => setOpen((previous) => !previous)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className="grid size-11 shrink-0 place-items-center rounded-full bg-paper-deep text-[11px] font-semibold text-royal ring-1 ring-ink/5 transition-colors hover:bg-paper-line"
      >
        {initials}
      </button>

      {open && (
        <div
          ref={menuRef}
          id="user-menu"
          role="menu"
          aria-label="Menu do usuário"
          className="absolute right-0 top-full z-30 mt-2 w-48 rounded-[12px] bg-paper p-1.5 text-ink shadow-lg ring-1 ring-ink/10"
          onKeyDown={(event) => {
            const items = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? []);
            const index = items.findIndex((item) => item === document.activeElement);
            if (event.key === "Escape") {
              event.preventDefault();
              setOpen(false);
              buttonRef.current?.focus();
            } else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
              event.preventDefault();
              const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1
                : (index + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
              items[nextIndex]?.focus();
            }
          }}
        >
          <button type="button" role="menuitem" onClick={() => showView("profile")}
            className="flex min-h-11 w-full items-center rounded-[8px] px-3 text-left text-[13px] font-medium hover:bg-paper-deep focus:bg-paper-deep">
            Perfil
          </button>
          <button type="button" role="menuitem" onClick={() => showView("settings")}
            className="flex min-h-11 w-full items-center rounded-[8px] px-3 text-left text-[13px] font-medium hover:bg-paper-deep focus:bg-paper-deep">
            Configurações
          </button>
          <div role="separator" className="mx-3 my-1.5 h-px bg-paper-line" />
          <LogoutButton />
        </div>
      )}

      <dialog
        ref={dialogRef}
        aria-labelledby="user-dialog-title"
        className="fixed inset-0 m-auto w-[calc(100%-40px)] max-w-sm rounded-[18px] bg-paper p-5 text-ink ring-1 ring-ink/10 backdrop:bg-ink/40"
        onClose={() => buttonRef.current?.focus()}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            const bounds = event.currentTarget.getBoundingClientRect();
            if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
              dialogRef.current?.close();
            }
          }
        }}
      >
        <h2 id="user-dialog-title" className="text-lg font-semibold">{view === "profile" ? "Perfil" : "Configurações"}</h2>
        {view === "profile" ? (
          <div className="mt-4 rounded-[12px] bg-paper-deep p-4">
            <p className="text-[11px] text-caderno-muted">Usuário conectado</p>
            <p className="mt-1 break-words text-[14px] font-medium">{userLabel}</p>
          </div>
        ) : (
          <p className="mt-4 text-[13px] text-caderno-muted">As configurações estarão disponíveis em breve.</p>
        )}
        <button type="button" onClick={() => dialogRef.current?.close()}
          className="mt-5 min-h-11 rounded-[8px] bg-royal px-4 py-2 text-[13px] font-medium text-paper transition-colors hover:bg-royal-mid">
          Fechar
        </button>
      </dialog>
    </div>
  );
}

const controlBase = "inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

export const buttonClass = `${controlBase} bg-primary text-on-primary shadow-sm hover:bg-primary-hover active:translate-y-px`;
export const secondaryButtonClass = `${controlBase} border border-border bg-surface text-primary hover:border-primary/40 hover:bg-primary-container`;
export const dangerButtonClass = `${controlBase} border border-expense/30 bg-surface text-expense hover:bg-expense-container`;
export const inputClass = "min-h-11 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-base text-foreground outline-none transition placeholder:text-muted focus:border-secondary focus:ring-4 focus:ring-secondary/10";
export const formCardClass = "grid gap-5 rounded-2xl border border-border-subtle bg-surface p-5 shadow-[0_12px_36px_-28px_rgba(15,118,110,0.5)] ring-1 ring-foreground/[0.02] sm:p-6";

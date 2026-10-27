export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-border-subtle bg-surface p-5 shadow-[0_12px_36px_-28px_rgba(15,118,110,0.5)] ring-1 ring-foreground/[0.02] sm:p-6 ${className}`}>{children}</div>;
}

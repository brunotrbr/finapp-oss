export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-border-subtle bg-surface p-5 shadow-[0_8px_30px_-24px_rgba(15,118,110,0.45)] sm:p-6 ${className}`}>{children}</div>;
}

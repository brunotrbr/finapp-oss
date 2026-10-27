export function PageHeader({ title, eyebrow, description, action }: { title: string; eyebrow?: string; description?: string; action?: React.ReactNode }) {
  return <header className="flex flex-wrap items-end justify-between gap-4"><div className="min-w-0 max-w-2xl">{eyebrow && <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary">{eyebrow}</p>}<h1 className="text-2xl font-bold tracking-[-0.025em] text-foreground sm:text-3xl">{title}</h1>{description && <p className="mt-2 text-sm leading-6 text-muted">{description}</p>}</div>{action}</header>;
}

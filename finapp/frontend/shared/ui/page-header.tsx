export function PageHeader({ title, eyebrow, action }: { title: string; eyebrow?: string; action?: React.ReactNode }) {
  return <header className="flex items-end justify-between gap-4"><div>{eyebrow && <p className="mb-1 text-sm text-zinc-500 dark:text-zinc-400">{eyebrow}</p>}<h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1></div>{action}</header>;
}

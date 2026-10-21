export default function Loading() {
  return <div aria-busy="true" aria-label="Carregando conteúdo" className="animate-pulse space-y-5"><div className="h-8 w-48 rounded bg-zinc-200 dark:bg-zinc-800" /><div className="h-36 rounded-2xl bg-zinc-200 dark:bg-zinc-800" /><div className="grid gap-4 sm:grid-cols-2"><div className="h-24 rounded-2xl bg-zinc-200 dark:bg-zinc-800" /><div className="h-24 rounded-2xl bg-zinc-200 dark:bg-zinc-800" /></div><span className="sr-only">Carregando…</span></div>;
}

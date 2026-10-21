import Link from "next/link";

export default function NotFound() {
  return <main className="grid min-h-dvh place-items-center bg-zinc-50 p-6 text-center text-zinc-950 dark:bg-black dark:text-zinc-50"><div><p className="text-6xl font-black text-zinc-300 dark:text-zinc-700">404</p><h1 className="mt-4 text-2xl font-bold">Página não encontrada</h1><p className="mt-2 text-sm text-zinc-500">O endereço informado não existe.</p><Link href="/dashboard" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-zinc-950 px-5 font-semibold text-white dark:bg-white dark:text-black">Ir para o início</Link></div></main>;
}

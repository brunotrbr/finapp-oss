import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { CallApiButton } from "./call-api-button";
import { LogoutButton } from "./logout-button";

export const metadata: Metadata = {
  title: "Dashboard | Finapp Finances",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-6 py-16 font-sans dark:bg-black">
      <main className="flex w-full max-w-2xl flex-col gap-8">
        <header className="flex items-center gap-4">
          {user.photoURL && (
            <Image
              src={user.photoURL}
              alt=""
              width={56}
              height={56}
              className="rounded-full"
            />
          )}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
              Welcome, {user.displayName ?? user.email}
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {user.email}
            </p>
          </div>
        </header>

        <CallApiButton />
        <LogoutButton />
      </main>
    </div>
  );
}

import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { AuthProvider } from "@/features/auth/auth-context";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({ variable: "--font-plus-jakarta", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Finapp Finances", template: "%s | Finapp Finances" },
  description: "Organize contas, lançamentos e cartões com clareza.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR" className={`${plusJakarta.variable} h-full antialiased`}><body className="flex min-h-full flex-col"><AuthProvider>{children}</AuthProvider></body></html>;
}

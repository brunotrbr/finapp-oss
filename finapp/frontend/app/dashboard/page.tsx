import type { Metadata } from "next";
import { Overview } from "@/features/finance/overview/overview";
export const metadata: Metadata = { title: "Contas" };
export default function Page() { return <Overview />; }

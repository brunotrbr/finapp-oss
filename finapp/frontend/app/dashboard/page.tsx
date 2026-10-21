import type { Metadata } from "next";
import { Overview } from "@/features/finance/overview/overview";

export const metadata: Metadata = {
  title: "Dashboard | Finapp Finances",
};

export default function DashboardPage() { return <Overview />; }

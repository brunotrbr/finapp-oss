import { IBM_Plex_Mono, Libre_Baskerville, Libre_Franklin } from "next/font/google";
import styles from "./dashboard.module.css";

const sans = Libre_Franklin({
  variable: "--font-caderno-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
const display = Libre_Baskerville({
  variable: "--font-caderno-serif",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});
const mono = IBM_Plex_Mono({
  variable: "--font-caderno-numbers",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${sans.variable} ${display.variable} ${mono.variable} ${styles.dashboard}`}>
      {children}
    </div>
  );
}

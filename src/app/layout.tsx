import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://orbicity-batumi.vercel.app"),
  title: {
    default: "Orbi City Batumi — Deniz Manzaralı Daire Rezervasyonu",
    template: "%s | Orbi City Batumi",
  },
  description:
    "Orbi City Batumi A-B-C bloklarında 150+ bağımsız daire. Studio, 1+1, 2+1, 3+1, Penthouse, Loft ve Duplex seçenekleri. Genius sadakat indirimleri, dinamik fiyatlandırma ve anında rezervasyon.",
  keywords: ["Orbi City", "Batumi", "daire kiralama", "deniz manzaralı", "tatil", "rezervasyon"],
  openGraph: {
    title: "Orbi City Batumi — Daire Rezervasyon Motoru",
    description: "150+ bağımsız daire, deniz manzarası, Genius indirimleri ve anında rezervasyon.",
    type: "website",
    images: ["/images/hero.jpg"],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <body className="flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

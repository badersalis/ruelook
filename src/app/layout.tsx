import type { Metadata, Viewport } from "next";
import { Archivo, Inter } from "next/font/google";
import "@/styles/globals.css";
import { Providers } from "./providers";
import { DemoBanner, Footer, Header } from "@/components/store/SiteChrome";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Ruelook: streetwear, picked for quality", template: "%s · Ruelook" },
  description:
    "Ruelook is an editorial streetwear store demo with an AI Stylist that completes the look. Designed & built by bader.salis.",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#f7f6f3", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${inter.variable}`}>
      <body>
        <a href="#main" className="sr-only z-50 bg-ink px-4 py-3 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
          Skip to content
        </a>
        <Providers>
          <DemoBanner />
          <Header />
          <main id="main" tabIndex={-1} className="outline-none">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}

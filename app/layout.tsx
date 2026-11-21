import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import AuthProvider from "@/src/components/AuthProvider";
import Header from "@/src/components/Header";

export const metadata: Metadata = {
  title: { default: "TolkoNovel — Baca dan tulis novel", template: "%s | TolkoNovel" },
  description: "Baca novel gratis dan tulis ceritamu sendiri di TolkoNovel.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#2563EB" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={GeistSans.variable}>
      <body>
        <AuthProvider>
          <Header />
          <main className="container page">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}

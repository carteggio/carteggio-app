import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Carteggio",
  description: "Conoscersi per le parole, non per la foto. In arrivo a Brescia e Bergamo.",
  manifest: "/manifest.json",
  themeColor: "#7a2e2a",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Carteggio",
  },
  openGraph: {
    title: "Carteggio",
    description: "Conoscersi per le parole, non per la foto.",
    type: "website",
    locale: "it_IT",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className={`${cormorant.variable} ${inter.variable}`}>
      <body className="bg-paper text-ink font-sans antialiased">{children}</body>
    </html>
  );
}

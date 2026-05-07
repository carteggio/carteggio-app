import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import SWRegister from "@/app/components/sw-register";
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
  metadataBase: new URL("https://carteggio.app"),
  title: "Carteggio",
  description:
    "Conoscersi per le parole, non per la foto. In arrivo a Brescia e Bergamo.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Carteggio",
  },
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Carteggio",
    description: "Conoscersi per le parole, non per la foto.",
    type: "website",
    locale: "it_IT",
    url: "https://carteggio.app",
    siteName: "Carteggio",
  },
};

export const viewport: Viewport = {
  themeColor: "#7a2e2a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className={`${cormorant.variable} ${inter.variable}`}>
      <body className="bg-paper text-ink font-sans antialiased">
        {/* Splash screen: visibile mentre i font/JS caricano, poi sfuma via.
            Stile inline così appare anche prima che i CSS siano scaricati. */}
        <div
          id="carteggio-splash"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            backgroundColor: "#f6f1e7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "opacity 400ms ease-out",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: "48px",
                fontWeight: 500,
                color: "#1a1814",
                letterSpacing: "-0.01em",
              }}
            >
              Cartegg
              <span
                style={{
                  color: "#7a2e2a",
                  fontStyle: "italic",
                }}
              >
                i
              </span>
              o
            </div>
            <div
              style={{
                fontFamily: "Georgia, serif",
                fontStyle: "italic",
                fontSize: "14px",
                color: "#8a8275",
                marginTop: "12px",
                letterSpacing: "0.02em",
              }}
            >
              le parole, prima della foto
            </div>
          </div>
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function hideSplash() {
                  var el = document.getElementById('carteggio-splash');
                  if (!el) return;
                  el.style.opacity = '0';
                  setTimeout(function() {
                    if (el && el.parentNode) el.parentNode.removeChild(el);
                  }, 450);
                }
                if (document.readyState === 'complete') {
                  setTimeout(hideSplash, 400);
                } else {
                  window.addEventListener('load', function() {
                    setTimeout(hideSplash, 400);
                  });
                }
              })();
            `,
          }}
        />
        <SWRegister />
        {children}
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { headers } from "next/headers";
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
  // mobile-web-app-capable è il successore standardizzato di apple-mobile-web-app-capable.
  // Apple e Google chiedono di tenerli entrambi finche' il transition non e' completo.
  other: {
    "mobile-web-app-capable": "yes",
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

// CSS dello splash screen, dichiarato qui invece che in globals.css per essere
// consegnato col primo HTML (no FOUC) e applicato col nonce della CSP. Usa
// font Georgia di sistema (non Cormorant via Google Fonts) per evitare flash:
// il punto dello splash è essere visibile SUBITO mentre i font Google caricano.
const splashCss = `
.carteggio-splash {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background-color: #f6f1e7;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 400ms ease-out;
  opacity: 1;
}
/* Classe applicata via JS per scatenare il fade-out: niente inline style,
   così la CSP strict 'style-src' senza 'unsafe-inline' non blocca nulla. */
.carteggio-splash-fading {
  opacity: 0;
}
.carteggio-splash-inner { text-align: center; }
.carteggio-splash-title {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 48px;
  font-weight: 500;
  color: #1a1814;
  letter-spacing: -0.01em;
}
.carteggio-splash-i {
  color: #7a2e2a;
  font-style: italic;
}
.carteggio-splash-subtitle {
  font-family: Georgia, serif;
  font-style: italic;
  font-size: 14px;
  color: #8a8275;
  margin-top: 12px;
  letter-spacing: 0.02em;
}
`;

const splashScript = `
(function() {
  function hideSplash() {
    var el = document.getElementById('carteggio-splash');
    if (!el) return;
    el.classList.add('carteggio-splash-fading');
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
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Il nonce è generato dal middleware (vedi app/middleware.ts) e propagato
  // qui via header. Lo applichiamo allo <style> e <script> inline così
  // restano consentiti dalla CSP strict (no 'unsafe-inline').
  const nonce = headers().get("x-nonce") ?? undefined;

  return (
    <html lang="it" className={`${cormorant.variable} ${inter.variable}`}>
      <body className="bg-paper text-ink font-sans antialiased">
        <style
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: splashCss }}
        />
        <div id="carteggio-splash" className="carteggio-splash">
          <div className="carteggio-splash-inner">
            <div className="carteggio-splash-title">
              Cartegg<span className="carteggio-splash-i">i</span>o
            </div>
            <div className="carteggio-splash-subtitle">
              le parole, prima della foto
            </div>
          </div>
        </div>
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: splashScript }}
        />
        <SWRegister />
        {children}
      </body>
    </html>
  );
}

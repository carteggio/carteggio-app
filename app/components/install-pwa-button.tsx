"use client";

import { useEffect, useState } from "react";

// Stato di installabilità della PWA, calcolato sul client.
// - loading: primo render, ancora non sappiamo (niente da mostrare)
// - supported: il browser ci ha dato un beforeinstallprompt (Android/Chrome/Edge)
// - ios: iPhone/iPad — niente prompt automatico, dobbiamo dire all'utente come fare
// - installed: l'app è già installata (display-mode standalone) → niente bottone
// - unsupported: browser senza supporto e non iOS → niente bottone, c'è sempre 'entra' come fallback
type InstallState =
  | { kind: "loading" }
  | { kind: "supported"; prompt: () => Promise<void> }
  | { kind: "ios" }
  | { kind: "installed" }
  | { kind: "unsupported" };

// Tipo del beforeinstallprompt event, non standard ma supportato dai browser Chromium.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPwaButton() {
  const [state, setState] = useState<InstallState>({ kind: "loading" });
  const [showIosTip, setShowIosTip] = useState(false);

  useEffect(() => {
    // Già in modalità standalone? Allora è già installata.
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS espone questa flag su navigator quando l'app è in standalone
      (navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setState({ kind: "installed" });
      return;
    }

    // Rilevazione iOS (iPhone/iPad). Su iOS l'install prompt automatico non esiste:
    // l'utente deve usare Condividi → Aggiungi alla schermata Home.
    const ua = navigator.userAgent;
    const isIos =
      /iPad|iPhone|iPod/.test(ua) ||
      // iPad su iOS 13+ si presenta come Mac, ma con touch
      (ua.includes("Mac") && "ontouchend" in document);

    if (isIos) {
      setState({ kind: "ios" });
      return;
    }

    // Android/Chrome/Edge: aspettiamo l'evento beforeinstallprompt.
    let savedPrompt: BeforeInstallPromptEvent | null = null;

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault(); // evita il mini-infobar di Chrome
      savedPrompt = e as BeforeInstallPromptEvent;
      setState({
        kind: "supported",
        prompt: async () => {
          if (!savedPrompt) return;
          await savedPrompt.prompt();
          await savedPrompt.userChoice;
          savedPrompt = null;
        },
      });
    };

    const onAppInstalled = () => {
      setState({ kind: "installed" });
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  if (state.kind === "loading" || state.kind === "installed" || state.kind === "unsupported") {
    return null;
  }

  if (state.kind === "supported") {
    return (
      <button
        type="button"
        onClick={() => void state.prompt()}
        className="font-sans text-sm tracking-[0.25em] uppercase bg-accent text-paper border border-accent rounded-full px-8 py-3 hover:opacity-90 transition-opacity"
      >
        installa carteggio
      </button>
    );
  }

  // iOS: bottone che apre/chiude un piccolo tooltip con le istruzioni.
  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => setShowIosTip((s) => !s)}
        className="font-sans text-sm tracking-[0.25em] uppercase bg-accent text-paper border border-accent rounded-full px-8 py-3 hover:opacity-90 transition-opacity"
        aria-expanded={showIosTip}
      >
        installa su iphone
      </button>
      {showIosTip && (
        <p className="font-serif italic text-sm text-ink-soft max-w-xs leading-relaxed">
          Tocca l&apos;icona{" "}
          <span aria-hidden="true" className="not-italic">
            ⬆︎
          </span>{" "}
          condividi in basso, poi scegli{" "}
          <span className="not-italic font-sans text-xs tracking-wider">
            Aggiungi alla schermata Home
          </span>
          .
        </p>
      )}
    </div>
  );
}

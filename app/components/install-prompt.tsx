"use client";

import { useEffect, useState } from "react";
import { isIOS, isStandalone } from "@/lib/push";

// Tipo per l'evento beforeinstallprompt (non standard, definito qui)
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export default function InstallPrompt() {
  const [installed, setInstalled] = useState<boolean | null>(null);
  const [iosSafari, setIosSafari] = useState(false);
  const [androidEvent, setAndroidEvent] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Già installato come PWA standalone
    if (isStandalone()) {
      setInstalled(true);
      return;
    }
    setInstalled(false);

    // iOS Safari: niente API, mostriamo istruzioni
    if (isIOS()) {
      setIosSafari(true);
      return;
    }

    // Android Chrome / Edge: c'è l'evento beforeinstallprompt
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setAndroidEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // Già installato durante questa sessione
    const onAppInstalled = () => {
      setInstalled(true);
      setAndroidEvent(null);
    };
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  async function handleAndroidInstall() {
    if (!androidEvent) return;
    await androidEvent.prompt();
    const result = await androidEvent.userChoice;
    if (result.outcome === "accepted") {
      setInstalled(true);
    }
    setAndroidEvent(null);
  }

  // Loading o già installato → niente da mostrare
  if (installed === null || installed === true) return null;

  // Android con prompt disponibile → bottone diretto
  if (androidEvent) {
    return (
      <div className="border border-rule rounded-lg p-5 text-center">
        <p className="font-sans text-xs tracking-widest uppercase text-ink-faded mb-3">
          installa l'app
        </p>
        <p className="font-serif italic text-base text-ink-soft mb-4 leading-relaxed">
          Installa Carteggio sul telefono.
          <br />
          Si apre come un'app, senza la barra del browser.
        </p>
        <button
          onClick={handleAndroidInstall}
          className="font-sans text-sm tracking-[0.25em] uppercase text-paper bg-accent rounded-full px-6 py-2.5 hover:bg-ink transition-colors"
        >
          installa
        </button>
      </div>
    );
  }

  // iOS Safari → istruzioni manuali
  if (iosSafari) {
    return (
      <div className="border border-rule rounded-lg p-5">
        <p className="font-sans text-xs tracking-widest uppercase text-ink-faded mb-3 text-center">
          installa l'app
        </p>
        <p className="font-serif italic text-base text-ink-soft text-center mb-5 leading-relaxed">
          Apple non permette l'installazione con un click,
          <br />
          ma è facile in tre tocchi:
        </p>
        <ol className="font-serif text-base text-ink leading-relaxed space-y-3 ml-1">
          <li className="flex gap-3">
            <span className="font-sans text-xs tracking-widest text-accent flex-shrink-0 mt-1">
              1
            </span>
            <span>
              Tocca il bottone <strong>Condividi</strong> nella barra del
              browser. È quello quadrato con la freccia che punta verso l'alto.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-sans text-xs tracking-widest text-accent flex-shrink-0 mt-1">
              2
            </span>
            <span>
              Scorri il menu e tocca{" "}
              <strong>Aggiungi alla schermata Home</strong>.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-sans text-xs tracking-widest text-accent flex-shrink-0 mt-1">
              3
            </span>
            <span>
              Tocca <strong>Aggiungi</strong> in alto a destra.
            </span>
          </li>
        </ol>
        <p className="font-serif italic text-sm text-ink-faded text-center mt-5 leading-relaxed">
          Carteggio appare come un'app sulla tua home.
          <br />
          Aprila da lì, non dal browser.
        </p>
      </div>
    );
  }

  // Browser desktop / altro → niente prompt
  return null;
}

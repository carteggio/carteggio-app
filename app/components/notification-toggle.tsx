"use client";

import { useEffect, useState } from "react";
import {
  subscribeToPush,
  unsubscribeFromPush,
  getCurrentSubscription,
  isIOS,
  isStandalone,
} from "@/lib/push";

type Status = "loading" | "unsupported" | "denied" | "default" | "subscribed";

export default function NotificationToggle() {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iosNeedInstall, setIosNeedInstall] = useState(false);

  useEffect(() => {
    void check();
  }, []);

  async function check() {
    if (typeof window === "undefined") return;

    // iOS: serve l'installazione "Aggiungi a Home" prima di poter chiedere notifiche
    if (isIOS() && !isStandalone()) {
      setIosNeedInstall(true);
      setStatus("unsupported");
      return;
    }

    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setStatus("unsupported");
      return;
    }

    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }

    const sub = await getCurrentSubscription();
    if (sub && Notification.permission === "granted") {
      setStatus("subscribed");
    } else {
      setStatus("default");
    }
  }

  async function handleEnable() {
    setBusy(true);
    setError(null);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setStatus(perm === "denied" ? "denied" : "default");
        return;
      }
      const result = await subscribeToPush();
      if (!result.ok) {
        setError(result.error ?? "Errore");
        return;
      }
      setStatus("subscribed");
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable() {
    setBusy(true);
    setError(null);
    try {
      await unsubscribeFromPush();
      setStatus("default");
    } finally {
      setBusy(false);
    }
  }

  if (status === "loading") {
    return null;
  }

  if (iosNeedInstall) {
    return (
      <div className="border border-rule rounded-lg p-5 text-center">
        <p className="font-sans text-xs tracking-widest uppercase text-ink-faded mb-3">
          notifiche
        </p>
        <p className="font-serif italic text-base text-ink-soft leading-relaxed">
          Per ricevere notifiche su iPhone, prima
          <br />
          aggiungi Carteggio alla schermata Home.
        </p>
        <p className="font-serif italic text-sm text-ink-faded mt-4 leading-relaxed">
          Tocca il bottone Condividi <span className="text-accent">↑</span> in
          basso al browser, poi
          <br />
          <strong>Aggiungi a Home</strong>. Apri Carteggio dall'icona, poi torna
          qui.
        </p>
      </div>
    );
  }

  if (status === "unsupported") {
    return (
      <div className="border border-rule rounded-lg p-5 text-center">
        <p className="font-sans text-xs tracking-widest uppercase text-ink-faded mb-3">
          notifiche
        </p>
        <p className="font-serif italic text-sm text-ink-soft leading-relaxed">
          Questo browser non supporta le notifiche.
          <br />
          Prova con Chrome o Safari aggiornato.
        </p>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="border border-rule rounded-lg p-5 text-center">
        <p className="font-sans text-xs tracking-widest uppercase text-ink-faded mb-3">
          notifiche
        </p>
        <p className="font-serif italic text-sm text-ink-soft leading-relaxed">
          Hai bloccato le notifiche dal browser.
          <br />
          Per riabilitarle, vai nelle impostazioni del browser
          <br />
          e permetti le notifiche per Carteggio.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-rule rounded-lg p-5 text-center">
      <p className="font-sans text-xs tracking-widest uppercase text-ink-faded mb-3">
        notifiche
      </p>

      {status === "subscribed" ? (
        <>
          <p className="font-serif italic text-base text-ink-soft mb-4 leading-relaxed">
            Ricevi notifiche per echi e nuove lettere.
          </p>
          <button
            onClick={handleDisable}
            disabled={busy}
            className="font-sans text-xs tracking-widest uppercase text-ink-faded border border-rule rounded-full px-5 py-2 hover:border-accent hover:text-accent transition-colors disabled:opacity-30"
          >
            {busy ? "salvo…" : "disattiva"}
          </button>
        </>
      ) : (
        <>
          <p className="font-serif italic text-base text-ink-soft mb-4 leading-relaxed">
            Quando ricevi un eco o una lettera,
            <br />
            te lo facciamo sapere.
          </p>
          <button
            onClick={handleEnable}
            disabled={busy}
            className="font-sans text-sm tracking-[0.25em] uppercase text-paper bg-accent rounded-full px-6 py-2.5 hover:bg-ink transition-colors disabled:opacity-30"
          >
            {busy ? "attivo…" : "attiva notifiche"}
          </button>
        </>
      )}

      {error && (
        <p className="font-serif italic text-sm text-accent mt-3">{error}</p>
      )}
    </div>
  );
}

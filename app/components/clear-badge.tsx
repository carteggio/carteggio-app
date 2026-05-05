"use client";

import { useEffect } from "react";

/**
 * Quando l'utente apre la pagina dei carteggi, cancella il badge sull'icona
 * dell'app (la pallina rossa con il numero sopra l'icona PWA).
 * È il segnale "ho letto, sono qui adesso".
 */
export default function ClearAppBadge() {
  useEffect(() => {
    if (typeof navigator !== "undefined" && "clearAppBadge" in navigator) {
      navigator.clearAppBadge?.().catch(() => {});
    }
  }, []);
  return null;
}

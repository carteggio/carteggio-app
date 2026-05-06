"use client";

import { useEffect } from "react";

/**
 * Componente che, quando montato, fa scattare un evento "unread-changed"
 * sulla window. Il Nav lo ascolta e rifà fetch di /api/unread per aggiornare
 * la badge sulla busta.
 *
 * Si usa nelle pagine dove il server ha appena marcato qualcosa come letto
 * (es. apertura di un singolo carteggio), per assicurarsi che il client
 * recuperi il count fresco anche se il pathname change non triggera
 * il refresh per via di quirk iOS PWA.
 */
export default function RefreshUnread() {
  useEffect(() => {
    // Piccolo delay per dare tempo al server di committare gli UPDATE
    // prima che la fetch parta. 200ms è abbondante.
    const t = setTimeout(() => {
      window.dispatchEvent(new Event("unread-changed"));
    }, 200);
    return () => clearTimeout(t);
  }, []);
  return null;
}

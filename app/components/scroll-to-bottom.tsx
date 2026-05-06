"use client";

import { useEffect } from "react";

/**
 * Scrolla la pagina al fondo al mount. Usato nelle pagine chat per partire
 * subito sull'ultimo messaggio + input box, come WhatsApp / iMessage.
 */
export default function ScrollToBottom() {
  useEffect(() => {
    // Doppio rAF: il primo lascia che il browser completi il layout dopo
    // l'idratazione, il secondo scrolla a fine documento.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" as ScrollBehavior });
      });
    });
  }, []);
  return null;
}

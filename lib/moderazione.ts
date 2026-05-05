// Filtro testuale lato server.
// Blocca: numeri di telefono, email, URL.
// Restituisce { ok: true } o { ok: false, reason: "..." } al primo match.

export type ModerazioneEsito =
  | { ok: true }
  | { ok: false; reason: string };

function containsPhoneNumber(text: string): boolean {
  // Rimuove formatting comune (spazi, trattini, punti, parentesi)
  const cleaned = text.replace(/[\s\-.\(\)]/g, "");
  // Internazionale: + seguito da 8+ cifre
  if (/\+\d{8,}/.test(cleaned)) return true;
  // Nazionale: 9+ cifre consecutive
  if (/\d{9,}/.test(cleaned)) return true;
  return false;
}

function containsEmail(text: string): boolean {
  return /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text);
}

function containsURL(text: string): boolean {
  // http://, https://, www., domini con TLD comuni
  if (/(?:https?:\/\/|www\.)\S+/i.test(text)) return true;
  if (/\b[\w-]+\.(it|com|org|net|eu|app|io|me|co|gov|edu|info|biz|tv)\b/i.test(text)) return true;
  return false;
}

export function checkContent(text: string): ModerazioneEsito {
  if (containsPhoneNumber(text)) {
    return {
      ok: false,
      reason:
        "Niente numeri di telefono qui. Usa il carteggio per parlare — è quello il punto.",
    };
  }
  if (containsEmail(text)) {
    return {
      ok: false,
      reason:
        "Niente indirizzi email qui. Le conversazioni reali si fanno dentro Carteggio.",
    };
  }
  if (containsURL(text)) {
    return {
      ok: false,
      reason: "Niente link.",
    };
  }
  return { ok: true };
}

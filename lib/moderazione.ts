// Filtro testuale lato server.
// Blocca: numeri di telefono, email, URL, parole offensive gravi.
// Restituisce { ok: true } o { ok: false, reason: "..." } al primo match.
//
// Per design questo filtro è chirurgico, non sterilizzante:
//   - i pattern anti-scam (telefoni/email/URL) sono ad alta confidence,
//     bloccano solo i casi inequivoci;
//   - la blacklist parole copre solo termini con confidence > 95% di essere
//     offensivi (slur razziali, omotransfobici, abilisti, sessisti gravi).
//     Le volgarità generiche (cazzo, merda, fanculo) NON sono in lista
//     perché il manifesto vuole una voce "personale, vulnerabile, italiana
//     calda": un ricordo difficile può legittimamente contenere parolacce.
//
// Il filtro è applicato dai chiamanti (azioni server) solo nei contesti
// "formali" del prodotto: pubblicazione pezzi, invio echi, lettera di
// apertura carteggio, slow phase del carteggio. Nella chat libera del
// carteggio attivo (post slow phase) il filtro NON viene chiamato.
// Questo è gestito a livello di chiamante, non qui.

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

// Blacklist parole offensive — Livello 1 (chirurgico).
// Solo termini con confidence molto alta di essere offensivi quando appaiono
// come parola intera. Tutto in lowercase, senza accenti (la normalizzazione
// del testo da analizzare è fatta in containsOffensive).
//
// Da curare e aggiornare periodicamente con Stefano e Alice mano a mano che
// si accumulano segnalazioni reali.
const BLACKLIST_PAROLE_OFFENSIVE: ReadonlySet<string> = new Set([
  // Slur razziali e xenofobi
  "negro", "negri", "negra", "negre",
  "terrone", "terroni", "terrona", "terrone",
  "zingaro", "zingari", "zingara", "zingare",
  "crucco", "crucchi", "crucca", "crucche",

  // Slur omofobi e transfobici
  "frocio", "froci", "frocia", "froce",
  "ricchione", "ricchioni", "ricchiona", "ricchione",
  "checca", "checche",
  "lesbicona", "lesbiconi", "lesbicone",

  // Abilismo
  "ritardato", "ritardata", "ritardati", "ritardate",
  "mongoloide", "mongoloidi",
  "handicappato", "handicappata", "handicappati", "handicappate",
  "minorato", "minorata", "minorati", "minorate",

  // Slur sessisti gravi (NON includiamo le volgarità generiche)
  "puttana", "puttane",
  "troia", "troie",
]);

function containsOffensive(text: string): boolean {
  // Normalizza: lowercase + rimuovi accenti, lasciando struttura parole
  // intatta. Match su parole intere via word boundary, così "Mar Nero" o
  // termini medici composti non vengono falsificati.
  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

  const words = normalized.match(/\b[a-z]+\b/g) ?? [];
  return words.some((w) => BLACKLIST_PAROLE_OFFENSIVE.has(w));
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
  if (containsOffensive(text)) {
    return {
      ok: false,
      reason:
        "Su Carteggio scegliamo le parole con cura. Quella è pesante anche se non l'avevi pensata così — riformula come ti viene meglio.",
    };
  }
  return { ok: true };
}

// Costanti condivise per il flusso carteggio.
// Importabile da Server e Client Components.

// Slow phase: i primi N messaggi del carteggio sono in formato lettera.
// 3 = ~3 giorni di scambio iniziale, poi chat libera.
export const SLOW_PHASE_MESSAGGI = 3;

export const MESSAGGIO_MIN_SLOW = 200;
export const MESSAGGIO_MAX_SLOW = 2000;
export const MESSAGGIO_MIN_FREE = 1;
// Limite alto, solo come safety contro paste accidentali enormi.
// Non viene mostrato all'utente nella UI in fase free (counter nascosto).
export const MESSAGGIO_MAX_FREE = 20000;

export const TIMEOUT_RISPOSTA_GIORNI = 7;
export const COOLDOWN_RISPOSTA_ORE = 24;

export const PHOTO_UNLOCK_AFTER_MESSAGES = 5;

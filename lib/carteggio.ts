// Costanti condivise per il flusso carteggio.
// Importabile da Server e Client Components.

export const SLOW_PHASE_MESSAGGI = 6; // dopo 6 messaggi totali (3 lettere a testa) → free
export const MESSAGGIO_MIN_SLOW = 200;
export const MESSAGGIO_MAX_SLOW = 2000;
export const MESSAGGIO_MIN_FREE = 1;
export const MESSAGGIO_MAX_FREE = 4000;

export const TIMEOUT_RISPOSTA_GIORNI = 7;
export const COOLDOWN_RISPOSTA_ORE = 24;

export const PHOTO_UNLOCK_AFTER_MESSAGES = 5; // sblocco foto (Pomeriggio 8)

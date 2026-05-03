// Costanti condivise per il flusso eco.
// Questo file NON deve mai importare moduli server-only (next/headers,
// supabase server client). È usato anche dai Client Components.

export const ECO_LIMITE_GIORNALIERO = 3;
export const ECO_TESTO_MIN = 40;
export const ECO_TESTO_MAX = 200;

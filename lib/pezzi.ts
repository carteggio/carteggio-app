// Costanti condivise per i pezzi.
// Questo file NON deve mai importare moduli server-only (next/headers,
// supabase server client). È usato anche dai Client Components.

// Massimo numero di pezzi NUOVI che un utente può pubblicare in un giorno
// (mezzanotte → mezzanotte, ora server). Niente cap totale a vita: i pezzi
// vecchi restano sempre nel feed e nel profilo. Questo limite è solo un
// freno alla velocità di pubblicazione, in coerenza con la voce slow del
// prodotto.
export const PEZZO_LIMITE_GIORNALIERO = 5;

// Messaggio educativo mostrato sotto il counter durante la scrittura.
// In tono manifesto: spiega "perché 5 e non 50" senza essere burocratico.
export const PEZZO_LIMITE_MESSAGGIO =
  "I pezzi sono lettere, non post. Cinque al giorno è la nostra misura: lascia che le parole si raffreddino prima di scriverne un'altra.";

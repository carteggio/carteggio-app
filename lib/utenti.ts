// Costanti condivise sui profili utenti.
// Questo file NON deve mai importare moduli server-only (next/headers,
// supabase server client). È usato anche dai Client Components.

// Fasce di età selezionabili in onboarding e mostrate sui profili.
// Ogni nuova fascia va aggiunta sia qui sia con una migration al tipo enum
// `fascia_eta` lato Postgres (vedi migration-10-fasce-eta-estese.sql).
//
// Granularità: intervalli di 5 anni fino a 60+. Coerente con la voce del
// prodotto: ogni persona trova una fascia che le somiglia, niente macro
// "tutti gli altri".
//
// Il valore legacy '40+' (presente nell'enum DB per gli utenti registrati
// prima dell'estensione) NON è in questa lista: non viene più offerto come
// opzione nei nuovi onboarding, ma chi l'ha già scelto continua a vederlo
// nel proprio profilo finché non lo cambia volontariamente.
export const FASCE_ETA = [
  "18-24",
  "25-30",
  "30-35",
  "35-40",
  "40-45",
  "45-50",
  "50-55",
  "55-60",
  "60+",
] as const;

export type FasciaEta = (typeof FASCE_ETA)[number];

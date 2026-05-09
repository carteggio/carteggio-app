import "server-only";

// Moderazione foto profilo via Sightengine API.
// Endpoint: https://api.sightengine.com/1.0/check.json
//
// Modelli usati: nudity-2.0 + offensive. In coppia, ogni check su un'immagine
// conta come 2 operazioni Sightengine. Free tier: 500 op/mese → 250 foto/mese
// circa, sufficienti per il pre-lancio Brescia (200-500 utenti, ~1 cambio
// foto ogni 1-2 mesi). Quando i volumi cresceranno, valutare se aggiungere
// 'wad' (weapons/alcohol/drugs) o passare al piano Standard ($59/mese).
//
// Behavior: fail-open. Se Sightengine è giù, le credenziali mancano, o la
// risposta è inattesa, l'upload NON viene bloccato. La moderazione foto è
// un layer di difesa aggiuntivo: la moderazione vera passa anche per le
// segnalazioni utente. Bloccare l'utente per un fail di un servizio esterno
// rompe l'esperienza in modo sproporzionato rispetto al rischio.

const SIGHTENGINE_API = "https://api.sightengine.com/1.0/check.json";
const MODELS = "nudity-2.0,offensive";

// Soglie di confidence per il blocco. Valori scelti più "stretti" delle
// raccomandazioni Sightengine perché Carteggio chiede letteralmente solo
// una foto del viso — qualsiasi cosa con nudo o gesti chiari è già fuori
// scope di prodotto.
const SOGLIE = {
  // nudity-2.0: blocco se nudo esplicito (qualsiasi categoria sexually
  // related) supera 0.4. Soglia bassa perché siamo conservativi.
  nudityExplicit: 0.4,
  // suggestive: bikini, lingerie, posa provocante. Soglia leggermente più
  // alta perché ci sono falsi positivi su foto in spiaggia/piscina che
  // possono comunque mostrare un viso. Decisione di prodotto: blocchiamo
  // anche queste, perché Carteggio chiede UNA foto del viso, non un'altra.
  nuditySuggestive: 0.6,
  // offensive: simboli di odio, gesti volgari espliciti.
  offensive: 0.5,
};

export type FotoModerazioneEsito =
  | { ok: true }
  | { ok: false; reason: string };

interface SightengineNudity {
  sexual_activity?: number;
  sexual_display?: number;
  erotica?: number;
  very_suggestive?: number;
  suggestive?: number;
  mildly_suggestive?: number;
  none?: number;
}

interface SightengineOffensive {
  nazi?: number;
  confederate?: number;
  supremacist?: number;
  terrorist?: number;
  middle_finger?: number;
  [key: string]: number | undefined;
}

interface SightengineResponse {
  status: "success" | "failure";
  nudity?: SightengineNudity;
  offensive?: SightengineOffensive;
  error?: { type: string; message: string };
}

/**
 * Verifica una foto contro Sightengine prima dell'upload su storage.
 * Bloccante: se torna { ok: false }, il chiamante deve interrompere il
 * salvataggio e mostrare il reason all'utente.
 */
export async function checkFoto(
  file: File | Blob
): Promise<FotoModerazioneEsito> {
  const apiUser = process.env.SIGHTENGINE_USER;
  const apiSecret = process.env.SIGHTENGINE_SECRET;

  if (!apiUser || !apiSecret) {
    // In sviluppo locale senza credenziali, lasciamo passare. In produzione
    // le env devono esserci sempre — se mancano lì, l'errore va investigato.
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[moderazione-foto] SIGHTENGINE_USER/SECRET mancanti in produzione"
      );
    }
    return { ok: true };
  }

  const body = new FormData();
  body.append("media", file);
  body.append("models", MODELS);
  body.append("api_user", apiUser);
  body.append("api_secret", apiSecret);

  let response: Response;
  try {
    response = await fetch(SIGHTENGINE_API, {
      method: "POST",
      body,
    });
  } catch (e) {
    console.error("[moderazione-foto] errore di rete verso Sightengine", e);
    return { ok: true }; // fail-open
  }

  if (!response.ok) {
    console.error(
      `[moderazione-foto] Sightengine HTTP ${response.status}`,
      await response.text().catch(() => "")
    );
    return { ok: true }; // fail-open
  }

  let data: SightengineResponse;
  try {
    data = (await response.json()) as SightengineResponse;
  } catch (e) {
    console.error("[moderazione-foto] risposta non JSON", e);
    return { ok: true }; // fail-open
  }

  if (data.status !== "success") {
    console.error(
      "[moderazione-foto] Sightengine status non success",
      data.error ?? data
    );
    return { ok: true }; // fail-open
  }

  // Nudity-2.0 check
  if (data.nudity) {
    const explicitMax = Math.max(
      data.nudity.sexual_activity ?? 0,
      data.nudity.sexual_display ?? 0,
      data.nudity.erotica ?? 0
    );
    if (explicitMax > SOGLIE.nudityExplicit) {
      return {
        ok: false,
        reason:
          "Su Carteggio basta una foto del tuo viso. Quella che hai caricato non va bene.",
      };
    }

    const suggestiveMax = Math.max(
      data.nudity.very_suggestive ?? 0,
      data.nudity.suggestive ?? 0
    );
    if (suggestiveMax > SOGLIE.nuditySuggestive) {
      return {
        ok: false,
        reason:
          "Per Carteggio chiediamo una foto semplice del viso. Prova con un'altra.",
      };
    }
  }

  // Offensive check (simboli di odio, gesti volgari)
  if (data.offensive) {
    const offensiveMax = Math.max(
      data.offensive.nazi ?? 0,
      data.offensive.confederate ?? 0,
      data.offensive.supremacist ?? 0,
      data.offensive.terrorist ?? 0,
      data.offensive.middle_finger ?? 0
    );
    if (offensiveMax > SOGLIE.offensive) {
      return {
        ok: false,
        reason:
          "La foto contiene un simbolo o un gesto che non sono in linea con Carteggio. Prova con un'altra.",
      };
    }
  }

  return { ok: true };
}

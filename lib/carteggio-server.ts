import "server-only";

import {
  SLOW_PHASE_MESSAGGI,
  MESSAGGIO_MIN_SLOW,
  MESSAGGIO_MAX_SLOW,
  MESSAGGIO_MIN_FREE,
  MESSAGGIO_MAX_FREE,
  TIMEOUT_RISPOSTA_GIORNI,
  COOLDOWN_RISPOSTA_ORE,
} from "@/lib/carteggio";

export type MessaggioRef = {
  id: string;
  mittente_id: string;
  created_at: string;
};

export type CarteggioPhase = "slow" | "free";

export type SendCheck = {
  canSend: boolean;
  reason?: string;
  phase: CarteggioPhase;
  minLength: number;
  maxLength: number;
  letteraNumero?: number;
};

export function getCarteggioPhase(numMessaggi: number): CarteggioPhase {
  return numMessaggi < SLOW_PHASE_MESSAGGI ? "slow" : "free";
}

const MESI_IT = [
  "gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
  "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre",
];

function formatDataOra(date: Date): string {
  const giorno = date.getDate();
  const mese = MESI_IT[date.getMonth()];
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${giorno} ${mese} alle ${hh}:${mm}`;
}

export function canSendMessage(params: {
  messages: MessaggioRef[];
  currentUserId: string;
  altroPartecipante?: { id: string; nome: string };
}): SendCheck {
  const { messages, currentUserId, altroPartecipante } = params;
  const phase = getCarteggioPhase(messages.length);

  if (phase === "free") {
    return {
      canSend: true,
      phase,
      minLength: MESSAGGIO_MIN_FREE,
      maxLength: MESSAGGIO_MAX_FREE,
    };
  }

  // Slow phase
  const letteraNumero = messages.length + 1;

  if (messages.length === 0) {
    return {
      canSend: true,
      phase,
      minLength: MESSAGGIO_MIN_SLOW,
      maxLength: MESSAGGIO_MAX_SLOW,
      letteraNumero,
    };
  }

  const last = messages[messages.length - 1];
  const nomeAltro = altroPartecipante?.nome ?? "L'altra persona";

  // Caso 1: l'ultimo messaggio è mio → sto aspettando l'altro/a
  if (last.mittente_id === currentUserId) {
    // Verifico se l'altro è in cooldown 24h dal suo ultimo messaggio
    if (altroPartecipante) {
      const altroMessages = messages.filter(
        (m) => m.mittente_id === altroPartecipante.id
      );
      if (altroMessages.length > 0) {
        const altroLast = altroMessages[altroMessages.length - 1];
        const altroCooldownEnd = new Date(altroLast.created_at).getTime() +
          COOLDOWN_RISPOSTA_ORE * 3600000;
        if (altroCooldownEnd > Date.now()) {
          return {
            canSend: false,
            reason: `${altroPartecipante.nome} potrà risponderti dal ${formatDataOra(
              new Date(altroCooldownEnd)
            )} in poi.`,
            phase,
            minLength: MESSAGGIO_MIN_SLOW,
            maxLength: MESSAGGIO_MAX_SLOW,
            letteraNumero,
          };
        }
      }
    }
    return {
      canSend: false,
      reason: `Aspetta che ${nomeAltro.toLowerCase() === "l'altra persona" ? "l'altra persona" : nomeAltro} ti risponda.`,
      phase,
      minLength: MESSAGGIO_MIN_SLOW,
      maxLength: MESSAGGIO_MAX_SLOW,
      letteraNumero,
    };
  }

  // Caso 2: ultimo messaggio dall'altro/a — controllo timeout 7 giorni
  const oreSinceLast =
    (Date.now() - new Date(last.created_at).getTime()) / 3600000;
  if (oreSinceLast > TIMEOUT_RISPOSTA_GIORNI * 24) {
    return {
      canSend: false,
      reason:
        "Sono passati più di sette giorni dall'ultimo messaggio. Il carteggio si è archiviato da solo.",
      phase,
      minLength: MESSAGGIO_MIN_SLOW,
      maxLength: MESSAGGIO_MAX_SLOW,
      letteraNumero,
    };
  }

  // Caso 3: il mio cooldown 24h dal mio ultimo messaggio
  const myMessages = messages.filter((m) => m.mittente_id === currentUserId);
  if (myMessages.length > 0) {
    const myLast = myMessages[myMessages.length - 1];
    const oreSinceMyLast =
      (Date.now() - new Date(myLast.created_at).getTime()) / 3600000;
    if (oreSinceMyLast < COOLDOWN_RISPOSTA_ORE) {
      const waitUntil = new Date(
        new Date(myLast.created_at).getTime() +
          COOLDOWN_RISPOSTA_ORE * 3600000
      );
      return {
        canSend: false,
        reason: `Una risposta al giorno per persona. Potrai scrivere di nuovo dal ${formatDataOra(
          waitUntil
        )}.`,
        phase,
        minLength: MESSAGGIO_MIN_SLOW,
        maxLength: MESSAGGIO_MAX_SLOW,
        letteraNumero,
      };
    }
  }

  return {
    canSend: true,
    phase,
    minLength: MESSAGGIO_MIN_SLOW,
    maxLength: MESSAGGIO_MAX_SLOW,
    letteraNumero,
  };
}

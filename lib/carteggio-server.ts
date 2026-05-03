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
  letteraNumero?: number; // numero della lettera nel ciclo slow (1-6)
};

export function getCarteggioPhase(numMessaggi: number): CarteggioPhase {
  return numMessaggi < SLOW_PHASE_MESSAGGI ? "slow" : "free";
}

export function canSendMessage(params: {
  messages: MessaggioRef[];
  currentUserId: string;
}): SendCheck {
  const { messages, currentUserId } = params;
  const phase = getCarteggioPhase(messages.length);

  // Free phase
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

  // Primo messaggio
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

  if (last.mittente_id === currentUserId) {
    return {
      canSend: false,
      reason: "Aspetta che l'altra persona ti risponda.",
      phase,
      minLength: MESSAGGIO_MIN_SLOW,
      maxLength: MESSAGGIO_MAX_SLOW,
      letteraNumero,
    };
  }

  // Last message dall'altro: verifica timeout 7 giorni
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

  // Verifica cooldown 24h dal mio ultimo messaggio
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
        reason: `Una risposta al giorno per persona. Puoi scrivere di nuovo da ${waitUntil.toLocaleString(
          "it-IT",
          { dateStyle: "long", timeStyle: "short" }
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

"use client";

import { useState, useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { sendMessaggio } from "./actions";
import type { CarteggioPhase } from "@/lib/carteggio-server";

type State = { error: string | null };
const initialState: State = { error: null };

function SubmitButton({
  canSubmit,
  phase,
}: {
  canSubmit: boolean;
  phase: CarteggioPhase;
}) {
  const { pending } = useFormStatus();
  const label = phase === "slow" ? "manda la lettera" : "invia";
  return (
    <button
      type="submit"
      disabled={!canSubmit || pending}
      className="w-full bg-ink text-paper rounded-lg py-3 font-sans text-sm tracking-widest uppercase font-medium hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-ink"
    >
      {pending ? "invio…" : label}
    </button>
  );
}

export default function MessaggioForm({
  carteggioId,
  phase,
  minLength,
  maxLength,
}: {
  carteggioId: string;
  phase: CarteggioPhase;
  minLength: number;
  maxLength: number;
}) {
  const [state, formAction] = useFormState(sendMessaggio, initialState);
  const [testo, setTesto] = useState("");
  const previousStateRef = useRef<State | null>(null);

  // Quando l'invio ha successo (state.error null e state è cambiato dal
  // render precedente), pulisce il textarea così l'utente può scrivere
  // il prossimo messaggio senza cancellare a mano.
  useEffect(() => {
    if (
      previousStateRef.current !== null &&
      state !== previousStateRef.current &&
      state.error === null
    ) {
      setTesto("");
    }
    previousStateRef.current = state;
  }, [state]);

  const len = testo.length;
  const isValid = len >= minLength && len <= maxLength;
  const counterColor =
    len > maxLength
      ? "text-accent"
      : len < minLength
        ? "text-ink-faded"
        : len > maxLength * 0.9
          ? "text-accent-soft"
          : "text-accent";

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="carteggioId" value={carteggioId} />

      <textarea
        name="messaggio"
        value={testo}
        onChange={(e) => setTesto(e.target.value)}
        required
        rows={phase === "slow" ? 8 : 4}
        maxLength={maxLength + 50}
        placeholder={
          phase === "slow"
            ? "Continua il carteggio. Almeno duecento caratteri."
            : "Scrivi…"
        }
        className="w-full bg-paper-deep border border-rule rounded-lg px-4 py-3 text-ink font-serif text-lg leading-relaxed focus:outline-none focus:border-accent transition-colors resize-none"
      />

      <p className={`text-center text-sm font-sans ${counterColor}`}>
        {len < minLength
          ? `${len} / ${minLength} caratteri (minimo)`
          : `${len} / ${maxLength}`}
      </p>

      {state.error && (
        <p className="font-serif italic text-sm text-accent text-center">
          {state.error}
        </p>
      )}

      <SubmitButton canSubmit={isValid} phase={phase} />
    </form>
  );
}

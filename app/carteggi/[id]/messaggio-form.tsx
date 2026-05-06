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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Quando l'invio ha successo, pulisce il textarea e lo riporta a una riga.
  useEffect(() => {
    if (
      previousStateRef.current !== null &&
      state !== previousStateRef.current &&
      state.error === null
    ) {
      setTesto("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
    previousStateRef.current = state;
  }, [state]);

  // Auto-grow del textarea: parte a una riga e si espande mentre scrivi.
  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    // Cap a circa 8 righe per non mangiare metà schermo
    const max = 8 * 28; // ~28px per riga (text-lg + leading-relaxed)
    el.style.height = `${Math.min(el.scrollHeight, max)}px`;
  }

  const len = testo.length;
  const isValid = len >= minLength && len <= maxLength;
  // Counter visibile SOLO in fase slow (dove c'è il minimo di 200 caratteri).
  // In fase libera niente count, niente limite mostrato.
  const showCounter = phase === "slow";
  const counterColor =
    len > maxLength
      ? "text-accent"
      : len < minLength
        ? "text-ink-faded"
        : "text-accent";

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="carteggioId" value={carteggioId} />

      <textarea
        ref={textareaRef}
        name="messaggio"
        value={testo}
        onChange={(e) => {
          setTesto(e.target.value);
          autoResize(e.currentTarget);
        }}
        required
        rows={1}
        maxLength={maxLength + 50}
        placeholder={
          phase === "slow"
            ? "Continua il carteggio. Almeno duecento caratteri."
            : "Scrivi…"
        }
        className="w-full bg-paper-deep border border-rule rounded-lg px-4 py-3 text-ink font-serif text-lg leading-relaxed focus:outline-none focus:border-accent transition-colors resize-none overflow-y-auto"
      />

      {showCounter && (
        <p className={`text-center text-sm font-sans ${counterColor}`}>
          {len < minLength
            ? `${len} / ${minLength} caratteri (minimo)`
            : `${len} / ${maxLength}`}
        </p>
      )}

      {state.error && (
        <p className="font-serif italic text-sm text-accent text-center">
          {state.error}
        </p>
      )}

      <SubmitButton canSubmit={isValid} phase={phase} />
    </form>
  );
}

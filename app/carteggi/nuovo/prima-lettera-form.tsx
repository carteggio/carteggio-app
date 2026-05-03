"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { apriCarteggio } from "./actions";
import { MESSAGGIO_MIN_SLOW, MESSAGGIO_MAX_SLOW } from "@/lib/carteggio";

type State = { error: string | null };
const initialState: State = { error: null };

function SubmitButton({ canSubmit }: { canSubmit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={!canSubmit || pending}
      className="w-full bg-ink text-paper rounded-lg py-3 font-sans text-sm tracking-widest uppercase font-medium hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-ink"
    >
      {pending ? "invio…" : "manda la lettera"}
    </button>
  );
}

export default function PrimaLetteraForm({
  ecoId,
  mittenteName,
}: {
  ecoId: string;
  mittenteName: string | null;
}) {
  const [state, formAction] = useFormState(apriCarteggio, initialState);
  const [testo, setTesto] = useState("");

  const len = testo.length;
  const isValid = len >= MESSAGGIO_MIN_SLOW && len <= MESSAGGIO_MAX_SLOW;
  const counterColor =
    len > MESSAGGIO_MAX_SLOW
      ? "text-accent"
      : len < MESSAGGIO_MIN_SLOW
        ? "text-ink-faded"
        : len > MESSAGGIO_MAX_SLOW * 0.9
          ? "text-accent-soft"
          : "text-accent";

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="ecoId" value={ecoId} />

      <div>
        <label
          htmlFor="messaggio"
          className="block font-sans text-xs tracking-widest uppercase text-ink-faded font-semibold mb-2"
        >
          la tua prima lettera
        </label>
        <textarea
          id="messaggio"
          name="messaggio"
          value={testo}
          onChange={(e) => setTesto(e.target.value)}
          required
          rows={10}
          maxLength={MESSAGGIO_MAX_SLOW + 50}
          placeholder={`Caro/a ${mittenteName ?? "..."},\n\nho letto il tuo eco e...`}
          className="w-full bg-paper-deep border border-rule rounded-lg px-4 py-3 text-ink font-serif text-lg leading-relaxed focus:outline-none focus:border-accent transition-colors resize-none"
        />
        <p className={`text-center text-sm font-sans mt-2 ${counterColor}`}>
          {len < MESSAGGIO_MIN_SLOW
            ? `${len} / ${MESSAGGIO_MIN_SLOW} caratteri (minimo)`
            : `${len} / ${MESSAGGIO_MAX_SLOW}`}
        </p>
      </div>

      {state.error && (
        <p className="font-serif italic text-sm text-accent text-center">
          {state.error}
        </p>
      )}

      <SubmitButton canSubmit={isValid} />

      <p className="font-serif italic text-xs text-ink-faded text-center mt-4 leading-relaxed">
        I primi sei messaggi del carteggio sono in formato lettera:
        <br />
        almeno duecento caratteri, una risposta al giorno per persona.
      </p>
    </form>
  );
}

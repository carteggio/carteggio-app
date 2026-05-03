"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { saveEco } from "./actions";
import { ECO_TESTO_MIN, ECO_TESTO_MAX, ECO_LIMITE_GIORNALIERO } from "@/lib/eco";

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
      {pending ? "invio…" : "manda l'eco"}
    </button>
  );
}

export default function EcoForm({
  pezzoId,
  echiOggi,
}: {
  pezzoId: string;
  echiOggi: number;
}) {
  const [state, formAction] = useFormState(saveEco, initialState);
  const [testo, setTesto] = useState("");

  const len = testo.length;
  const isValid = len >= ECO_TESTO_MIN && len <= ECO_TESTO_MAX;
  const counterColor =
    len > ECO_TESTO_MAX
      ? "text-accent"
      : len < ECO_TESTO_MIN
        ? "text-ink-faded"
        : len > ECO_TESTO_MAX * 0.9
          ? "text-accent-soft"
          : "text-accent";

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="pezzoId" value={pezzoId} />

      <div>
        <label
          htmlFor="testo"
          className="block font-sans text-xs tracking-widest uppercase text-ink-faded font-semibold mb-2"
        >
          il tuo eco
        </label>
        <textarea
          id="testo"
          name="testo"
          value={testo}
          onChange={(e) => setTesto(e.target.value)}
          required
          rows={4}
          maxLength={ECO_TESTO_MAX + 30}
          placeholder="Scrivi qualcosa di vero. Non per piacergli, ma per dirgli che l'hai letto."
          className="w-full bg-paper-deep border border-rule rounded-lg px-4 py-3 text-ink font-serif text-lg leading-relaxed focus:outline-none focus:border-accent transition-colors resize-none italic"
        />
        <p className={`text-center text-sm font-sans mt-2 ${counterColor}`}>
          {len < ECO_TESTO_MIN
            ? `${len} / ${ECO_TESTO_MIN} caratteri (minimo)`
            : `${len} / ${ECO_TESTO_MAX}`}
        </p>
      </div>

      {state.error && (
        <p className="font-serif italic text-sm text-accent text-center">
          {state.error}
        </p>
      )}

      <SubmitButton canSubmit={isValid} />

      <p className="font-serif italic text-xs text-ink-faded text-center mt-4 leading-relaxed">
        Hai mandato {echiOggi} {echiOggi === 1 ? "eco" : "echi"} oggi su{" "}
        {ECO_LIMITE_GIORNALIERO}.
        <br />
        L'eco è privato: lo legge solo l'autore.
      </p>
    </form>
  );
}

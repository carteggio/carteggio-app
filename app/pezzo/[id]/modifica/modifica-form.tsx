"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { aggiornaPezzo, eliminaPezzo } from "./actions";
import { findFormato, countWords, type FormatoPezzo } from "@/lib/formati";

type State = { error: string | null };
const initialState: State = { error: null };

function SubmitButton({
  canSubmit,
  label,
}: {
  canSubmit: boolean;
  label: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={!canSubmit || pending}
      className="w-full bg-ink text-paper rounded-lg py-3 font-sans text-sm tracking-widest uppercase font-medium hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-ink"
    >
      {pending ? "salvo…" : label}
    </button>
  );
}

export default function ModificaForm({
  pezzoId,
  formato,
  contenutoIniziale,
}: {
  pezzoId: string;
  formato: FormatoPezzo;
  contenutoIniziale: string;
}) {
  const [state, formAction] = useFormState(aggiornaPezzo, initialState);
  const [contenuto, setContenuto] = useState(contenutoIniziale);

  const fmt = findFormato(formato);
  const wordCount = countWords(contenuto);
  const charCount = contenuto.length;

  let counterText = "";
  let counterColor = "text-ink-faded";
  let isValid = false;

  if (fmt) {
    if (fmt.exactWords) {
      counterText = `${wordCount} di ${fmt.exactWords} parole`;
      isValid = wordCount === fmt.exactWords && contenuto.trim().length > 0;
      counterColor = isValid ? "text-accent" : "text-ink-faded";
    } else {
      counterText = `${charCount} / ${fmt.maxChars}`;
      isValid = charCount > 0 && charCount <= fmt.maxChars;
      if (charCount > fmt.maxChars) counterColor = "text-accent";
      else if (charCount > fmt.maxChars * 0.85) counterColor = "text-accent-soft";
    }
  }

  return (
    <div className="space-y-8">
      {/* Form di modifica */}
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="pezzoId" value={pezzoId} />

        {fmt?.prompt && (
          <p className="font-serif italic text-lg text-ink-soft text-center mb-2">
            {fmt.prompt}
          </p>
        )}

        {fmt?.multiline ? (
          <textarea
            name="contenuto"
            value={contenuto}
            onChange={(e) => setContenuto(e.target.value)}
            placeholder={fmt.placeholder}
            required
            rows={5}
            className="w-full bg-paper-deep border border-rule rounded-lg px-4 py-3 text-ink font-serif text-lg leading-relaxed focus:outline-none focus:border-accent transition-colors resize-none"
          />
        ) : (
          <input
            type="text"
            name="contenuto"
            value={contenuto}
            onChange={(e) => setContenuto(e.target.value)}
            placeholder={fmt?.placeholder ?? ""}
            required
            maxLength={(fmt?.maxChars ?? 0) + 20}
            className="w-full bg-paper-deep border border-rule rounded-lg px-4 py-3 text-ink font-serif text-xl text-center focus:outline-none focus:border-accent transition-colors"
          />
        )}

        <p className={`text-center text-sm font-sans ${counterColor}`}>
          {counterText}
        </p>

        {state.error && (
          <p className="font-serif italic text-sm text-accent text-center">
            {state.error}
          </p>
        )}

        <SubmitButton canSubmit={isValid} label="salva modifiche" />
      </form>

      {/* Form di eliminazione separato */}
      <form
        action={eliminaPezzo}
        className="border-t border-rule pt-8 text-center"
        onSubmit={(e) => {
          if (
            !confirm(
              "Sicura di voler eliminare questo pezzo? L'azione non si può annullare."
            )
          ) {
            e.preventDefault();
          }
        }}
      >
        <input type="hidden" name="pezzoId" value={pezzoId} />
        <button
          type="submit"
          className="font-sans text-xs tracking-widest uppercase text-ink-faded hover:text-accent transition-colors"
        >
          elimina pezzo
        </button>
        <p className="font-serif italic text-xs text-ink-faded mt-2">
          Lo nasconde dal feed e dal tuo profilo.
          <br />
          Eventuali echi e carteggi che hai ricevuto restano.
        </p>
      </form>
    </div>
  );
}

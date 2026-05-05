"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { saveSegnalazione } from "./actions";

type State = { error: string | null };
const initialState: State = { error: null };

const CATEGORIE = [
  { id: "inappropriato", label: "Contenuto inappropriato", desc: "Testo offensivo, fuori luogo, indesiderato." },
  { id: "aggressivo", label: "Comportamento aggressivo", desc: "Insulti, molestie, minacce." },
  { id: "bot_scam", label: "Bot o tentativo di truffa", desc: "Sembra automatizzato o vuole portarmi fuori dall'app." },
  { id: "foto_non_consensuali", label: "Foto inappropriate", desc: "Nudità non consensuali o contenuti espliciti." },
  { id: "altro", label: "Altro", desc: "Specifica nel campo qui sotto." },
] as const;

function SubmitButton({ canSubmit }: { canSubmit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={!canSubmit || pending}
      className="w-full bg-ink text-paper rounded-lg py-3 font-sans text-sm tracking-widest uppercase font-medium hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
    >
      {pending ? "invio…" : "invia segnalazione"}
    </button>
  );
}

export default function SegnalaForm({
  tipo,
  targetId,
}: {
  tipo: string;
  targetId: string;
}) {
  const [state, formAction] = useFormState(saveSegnalazione, initialState);
  const [categoria, setCategoria] = useState<string>("");

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="tipo" value={tipo} />
      <input type="hidden" name="targetId" value={targetId} />

      <div className="space-y-2">
        {CATEGORIE.map((c) => (
          <label
            key={c.id}
            className="block cursor-pointer p-4 border border-rule rounded-lg hover:border-accent transition-colors has-[:checked]:border-accent has-[:checked]:bg-paper-deep"
          >
            <input
              type="radio"
              name="categoria"
              value={c.id}
              required
              checked={categoria === c.id}
              onChange={() => setCategoria(c.id)}
              className="hidden"
            />
            <div className="font-serif text-base font-medium text-ink mb-1">
              {c.label}
            </div>
            <div className="font-serif italic text-sm text-ink-faded">
              {c.desc}
            </div>
          </label>
        ))}
      </div>

      <div>
        <label
          htmlFor="motivazione"
          className="block font-sans text-xs tracking-widest uppercase text-ink-faded font-semibold mb-2"
        >
          dettagli (opzionale)
        </label>
        <textarea
          id="motivazione"
          name="motivazione"
          rows={4}
          maxLength={500}
          placeholder="Quello che vuoi raccontarci per aiutarci a decidere."
          className="w-full bg-paper-deep border border-rule rounded-lg px-4 py-3 text-ink font-serif text-base leading-relaxed focus:outline-none focus:border-accent transition-colors resize-none"
        />
      </div>

      {state.error && (
        <p className="font-serif italic text-sm text-accent text-center">
          {state.error}
        </p>
      )}

      <SubmitButton canSubmit={categoria.length > 0} />

      <p className="font-serif italic text-xs text-ink-faded text-center mt-4 leading-relaxed">
        La tua segnalazione è privata. Solo l'amministrazione la legge.
      </p>
    </form>
  );
}

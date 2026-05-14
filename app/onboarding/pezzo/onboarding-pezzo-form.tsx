"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { savePezzo } from "../actions";
import { FORMATI, findFormato, countWords } from "@/lib/formati";

function SubmitButton({ canSubmit }: { canSubmit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={!canSubmit || pending}
      className="w-full bg-ink text-paper rounded-lg py-3 font-sans text-sm tracking-widest uppercase font-medium hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-ink"
    >
      {pending ? "salvo…" : "pubblica e completa"}
    </button>
  );
}

// Onboarding step 4 — primo pezzo.
// Permette di scegliere uno dei 5 formati pubblici (niente "voce" qui, è
// formato disponibile solo nei carteggi dopo la slow phase). Validazione
// client-side replica quella in lib/formati: word count esatto per
// 'sei-parole', char count per gli altri. Submit della server action
// savePezzo valida di nuovo lato server come difesa.
export default function OnboardingPezzoForm({
  initialError,
}: {
  initialError?: string;
}) {
  const [formato, setFormato] = useState<string>("");
  const [contenuto, setContenuto] = useState("");

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
    <form action={savePezzo} className="mt-12 space-y-8">
      {/* Selettore formato */}
      <div className="space-y-2">
        <p className="block font-sans text-xs tracking-widest uppercase text-ink-faded font-semibold mb-3">
          scegli un formato
        </p>
        {FORMATI.map((f) => (
          <label
            key={f.id}
            className="block cursor-pointer p-4 border border-rule rounded-lg hover:border-accent transition-colors has-[:checked]:border-accent has-[:checked]:bg-paper-deep"
          >
            <input
              type="radio"
              name="formato"
              value={f.id}
              required
              checked={formato === f.id}
              onChange={() => {
                setFormato(f.id);
                setContenuto("");
              }}
              className="hidden"
            />
            <div className="flex items-baseline gap-3">
              <span className="font-serif text-lg font-medium text-ink">
                {f.label}
              </span>
              <span className="font-serif italic text-sm text-ink-faded">
                — {f.description}
              </span>
            </div>
          </label>
        ))}
      </div>

      {/* Editor: solo dopo che il formato è selezionato */}
      {fmt && (
        <div className="space-y-3 pt-4 border-t border-rule">
          {fmt.prompt && (
            <p className="font-serif italic text-lg text-ink-soft text-center">
              {fmt.prompt}
            </p>
          )}

          {fmt.multiline ? (
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
              placeholder={fmt.placeholder}
              required
              maxLength={fmt.maxChars + 20}
              className="w-full bg-paper-deep border border-rule rounded-lg px-4 py-3 text-ink font-serif text-xl text-center focus:outline-none focus:border-accent transition-colors"
            />
          )}

          <p className={`text-center text-sm font-sans ${counterColor}`}>
            {counterText}
          </p>
        </div>
      )}

      {initialError && (
        <p className="font-serif italic text-sm text-accent text-center">
          {initialError}
        </p>
      )}

      <SubmitButton canSubmit={isValid} />
    </form>
  );
}

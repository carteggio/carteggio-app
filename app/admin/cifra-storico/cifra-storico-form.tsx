"use client";

import { useState, useTransition } from "react";
import { cifraStoricoMessaggi, type CifraturaResult } from "./actions";

export default function CifraStoricoForm() {
  const [risultato, setRisultato] = useState<CifraturaResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const r = await cifraStoricoMessaggi();
      setRisultato(r);
    });
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="w-full bg-ink text-paper rounded-lg py-3 font-sans text-sm tracking-widest uppercase font-medium hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "cifratura in corso…" : "cifra tutto lo storico"}
      </button>

      {risultato && (
        <div
          className={`border rounded-lg p-5 ${
            risultato.ok ? "border-rule bg-paper-deep" : "border-accent bg-paper-deep"
          }`}
        >
          {risultato.ok ? (
            <div className="space-y-2">
              <p className="font-serif italic text-base text-ink leading-relaxed">
                Fatto.
              </p>
              <p className="font-sans text-sm text-ink-soft">
                Messaggi cifrati ora:{" "}
                <strong>{risultato.messaggiCifrati}</strong> su{" "}
                {risultato.messaggiTotali}.
              </p>
              <p className="font-sans text-sm text-ink-soft">
                Echi cifrati ora: <strong>{risultato.echiCifrati}</strong> su{" "}
                {risultato.echiTotali}.
              </p>
              <p className="font-serif italic text-sm text-ink-faded mt-3">
                Ricarica la pagina per vedere lo stato aggiornato.
              </p>
            </div>
          ) : (
            <p className="font-serif italic text-base text-accent leading-relaxed">
              {risultato.error ?? "Errore sconosciuto."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

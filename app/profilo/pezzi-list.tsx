"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { FORMATO_LABEL, type FormatoPezzo } from "@/lib/formati";
import { formatRelativeDate } from "@/lib/date";
import { loadMorePezzi, type PezzoMin } from "./actions";

const PAGE_SIZE = 50;

type Props = {
  initialPezzi: PezzoMin[];
  totale: number;
};

export default function PezziList({ initialPezzi, totale }: Props) {
  const [pezzi, setPezzi] = useState<PezzoMin[]>(initialPezzi);
  const [hasMore, setHasMore] = useState(initialPezzi.length < totale);
  const [errore, setErrore] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleLoadMore() {
    setErrore(null);
    startTransition(async () => {
      const res = await loadMorePezzi(pezzi.length);
      if (res.pezzi.length === 0 && res.hasMore === false) {
        // Nessun pezzo aggiunto: o non c'è più nulla, o c'è stato un errore
        setHasMore(false);
        if (pezzi.length < totale) {
          setErrore("Non sono riuscito a caricarne altri. Riprova.");
        }
        return;
      }
      // Dedup difensivo: in caso di race condition (es. nuovi pezzi pubblicati
      // tra il primo SSR e il loadMore) potremmo ricevere id già presenti.
      const idsAttuali = new Set(pezzi.map((p) => p.id));
      const nuovi = res.pezzi.filter((p) => !idsAttuali.has(p.id));
      setPezzi((prev) => [...prev, ...nuovi]);
      setHasMore(res.hasMore && pezzi.length + nuovi.length < totale);
    });
  }

  return (
    <>
      <div className="space-y-12">
        {pezzi.map((p) => (
          <article
            key={p.id}
            className="border-b border-rule pb-12 last:border-b-0"
          >
            <p className="font-sans text-xs tracking-widest uppercase text-ink-faded mb-4">
              {FORMATO_LABEL[p.formato as FormatoPezzo]}
            </p>
            <div
              className={`font-serif whitespace-pre-line leading-relaxed ${
                p.formato === "sei-parole"
                  ? "text-2xl text-center"
                  : p.formato === "ricordo" || p.formato === "luogo"
                    ? "italic text-xl"
                    : "text-xl"
              }`}
            >
              {p.contenuto_testo}
            </div>
            <div className="mt-4 flex items-baseline justify-between gap-3">
              <p className="font-serif italic text-sm text-ink-faded">
                {formatRelativeDate(p.created_at)}
              </p>
              <Link
                href={`/pezzo/${p.id}/modifica`}
                className="font-sans text-xs tracking-widest uppercase text-ink-faded hover:text-accent transition-colors"
              >
                modifica · elimina
              </Link>
            </div>
          </article>
        ))}
      </div>

      {/* Footer paginazione: mostrato solo se ci sono più di PAGE_SIZE totali */}
      {totale > PAGE_SIZE && (
        <div className="text-center mt-12 space-y-3">
          <p className="font-sans text-xs tracking-widest uppercase text-ink-faded">
            {pezzi.length} di {totale} pezzi
          </p>
          {hasMore ? (
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={isPending}
              className="font-sans text-sm tracking-[0.25em] uppercase text-ink-faded border border-rule rounded-full px-6 py-2.5 hover:border-accent hover:text-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "carico…" : `carica altri ${PAGE_SIZE}`}
            </button>
          ) : (
            <p className="font-serif italic text-sm text-ink-faded">
              li hai visti tutti.
            </p>
          )}
          {errore && (
            <p className="font-serif italic text-sm text-accent">{errore}</p>
          )}
        </div>
      )}
    </>
  );
}

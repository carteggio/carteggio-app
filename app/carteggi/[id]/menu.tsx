"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { bloccaUtente } from "./actions";

/**
 * Menu kebab (i tre puntini) in alto a destra dell'header del carteggio.
 * Contiene "segnala" e "blocca" — azioni rare che non meritano spazio
 * permanente in fondo alla pagina.
 */
export default function CarteggioMenu({
  carteggioId,
  altroId,
  altroNome,
}: {
  carteggioId: string;
  altroId: string;
  altroNome: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Click fuori → chiudi
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="opzioni del carteggio"
        aria-expanded={open}
        className="p-2 -mr-2 text-ink-faded hover:text-accent transition-colors"
      >
        {/* Tre puntini verticali */}
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-paper border border-rule rounded-lg shadow-lg overflow-hidden z-20">
          <Link
            href={`/segnala?tipo=utente&id=${altroId}`}
            onClick={() => setOpen(false)}
            className="block px-4 py-3 font-sans text-sm text-ink hover:bg-paper-deep border-b border-rule"
          >
            segnala {altroNome}
          </Link>
          <form action={bloccaUtente}>
            <input type="hidden" name="carteggioId" value={carteggioId} />
            <button
              type="submit"
              className="w-full text-left px-4 py-3 font-sans text-sm text-accent hover:bg-paper-deep"
            >
              blocca {altroNome}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

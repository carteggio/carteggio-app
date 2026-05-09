import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/profile";
import { FORMATO_LABEL, type FormatoPezzo } from "@/lib/formati";
import { formatRelativeDate } from "@/lib/date";
import { decifraMessaggio } from "@/lib/crypto-messaggi";
import Nav from "@/app/components/nav";

export const dynamic = "force-dynamic";

// Tipo "appiattito" che usiamo nel render. La query Supabase restituisce
// dati nidificati (eco → pezzo → autore, eco → mittente); li trasformiamo
// in questa shape più semplice subito dopo il fetch.
type EcoStorico = {
  id: string;
  testo: string;
  stato: "in_attesa" | "risposto" | "non_risposto" | "archiviato";
  created_at: string;
  altraPersona: {
    id: string;
    nome_battesimo: string;
    fascia_eta: string;
  } | null;
  pezzo: {
    id: string;
    formato: string;
    contenuto_testo: string | null;
    autore_id: string;
  } | null;
  carteggioId: string | null;
};

const STATO_LABEL: Record<string, string> = {
  in_attesa: "in attesa di risposta",
  risposto: "ha aperto un carteggio",
  non_risposto: "ha scelto di non rispondere",
  archiviato: "archiviato",
};

export default async function EchiStoricoPage() {
  const { user, profile } = await getCurrentProfile();
  if (!user) redirect("/login");
  if (!profile) redirect("/onboarding/eta");

  const supabase = createClient();

  // Lancio in parallelo le tre fetch indipendenti:
  //   1. Echi inviati da me (mittente_id = me)
  //   2. Echi ricevuti da me (autore del pezzo = me, via JOIN)
  //   3. Carteggi che hanno come eco_origine uno qualunque degli echi sopra
  //      (per linkare al carteggio se l'eco è stato risposto e ha aperto chat)
  // Per gli echi inviati: solo il join verso il pezzo. L'utente destinatario
  // (= autore del pezzo) lo recupero in batch dopo, perché Supabase non ha
  // un alias diretto da echi a users passando per pezzi.
  // Per gli echi ricevuti: !inner per filtrare solo righe con pezzo dell'utente
  // corrente come autore, + join con mittente diretto via FK echi.mittente_id.
  const [echiInviatiRes, echiRicevutiRes] = await Promise.all([
    supabase
      .from("echi")
      .select(
        `
        id, testo, stato, created_at,
        pezzo:pezzi!pezzo_id ( id, formato, contenuto_testo, autore_id )
      `
      )
      .eq("mittente_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("echi")
      .select(
        `
        id, testo, stato, created_at,
        pezzo:pezzi!pezzo_id!inner ( id, formato, contenuto_testo, autore_id ),
        mittente:users!mittente_id ( id, nome_battesimo, fascia_eta )
      `
      )
      .eq("pezzo.autore_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  // Trasformo i risultati raw in shape unificata + decifratura testo + batch
  // lookup destinatari (autori dei pezzi che ho ecato).
  type EcoInviatoRaw = {
    id: string;
    testo: string;
    stato: EcoStorico["stato"];
    created_at: string;
    pezzo: {
      id: string;
      formato: string;
      contenuto_testo: string | null;
      autore_id: string;
    } | null;
  };
  type EcoRicevutoRaw = {
    id: string;
    testo: string;
    stato: EcoStorico["stato"];
    created_at: string;
    pezzo: {
      id: string;
      formato: string;
      contenuto_testo: string | null;
      autore_id: string;
    } | null;
    mittente: {
      id: string;
      nome_battesimo: string;
      fascia_eta: string;
    } | null;
  };

  const echiInviatiRaw = (echiInviatiRes.data ?? []) as unknown as EcoInviatoRaw[];
  const echiRicevutiRaw = (echiRicevutiRes.data ?? []) as unknown as EcoRicevutoRaw[];

  // Per gli echi inviati, recupero in batch i destinatari (autori dei pezzi)
  const destinatariIds = Array.from(
    new Set(
      echiInviatiRaw
        .map((e) => e.pezzo?.autore_id)
        .filter((id): id is string => Boolean(id))
    )
  );
  let destinatariById = new Map<
    string,
    { id: string; nome_battesimo: string; fascia_eta: string }
  >();
  if (destinatariIds.length > 0) {
    const { data: destinatari } = await supabase
      .from("users")
      .select("id, nome_battesimo, fascia_eta")
      .in("id", destinatariIds);
    destinatariById = new Map(
      (destinatari ?? []).map((u) => [
        u.id,
        u as { id: string; nome_battesimo: string; fascia_eta: string },
      ])
    );
  }

  // Recupero in batch i carteggi che hanno come eco_origine uno qualunque
  // degli echi nello storico (sia inviati che ricevuti). Mi serve a mostrare
  // il link "→ vai al carteggio aperto" sotto agli echi che hanno generato
  // una conversazione.
  const tuttiEcoIds = [
    ...echiInviatiRaw.map((e) => e.id),
    ...echiRicevutiRaw.map((e) => e.id),
  ];
  let carteggioByEcoId = new Map<string, string>();
  if (tuttiEcoIds.length > 0) {
    const { data: carteggi } = await supabase
      .from("carteggi")
      .select("id, eco_origine_id")
      .in("eco_origine_id", tuttiEcoIds);
    carteggioByEcoId = new Map(
      (carteggi ?? []).map((c) => [c.eco_origine_id as string, c.id as string])
    );
  }

  // Trasforma in shape unificata + decifratura
  const echiInviati: EcoStorico[] = echiInviatiRaw.map((e) => ({
    id: e.id,
    testo: decifraMessaggio(e.testo) ?? e.testo,
    stato: e.stato,
    created_at: e.created_at,
    altraPersona: e.pezzo?.autore_id
      ? destinatariById.get(e.pezzo.autore_id) ?? null
      : null,
    pezzo: e.pezzo,
    carteggioId: carteggioByEcoId.get(e.id) ?? null,
  }));

  const echiRicevuti: EcoStorico[] = echiRicevutiRaw.map((e) => ({
    id: e.id,
    testo: decifraMessaggio(e.testo) ?? e.testo,
    stato: e.stato,
    created_at: e.created_at,
    altraPersona: e.mittente,
    pezzo: e.pezzo,
    carteggioId: carteggioByEcoId.get(e.id) ?? null,
  }));

  const totale = echiInviati.length + echiRicevuti.length;

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 px-6 py-12 pb-32">
        <div className="max-w-xl mx-auto">
          <Link
            href="/carteggi"
            className="font-sans text-xs tracking-widest uppercase text-ink-faded hover:text-accent transition-colors"
          >
            ← carteggi
          </Link>

          <header className="text-center mt-8 mb-12">
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-ink-faded mb-3">
              storico
            </p>
            <h1 className="font-serif text-4xl md:text-5xl font-medium leading-none">
              Le parole scambiate.
            </h1>
            <p className="font-serif italic text-base text-ink-soft mt-3 leading-relaxed">
              Quello che hai scritto, e quello che ti hanno scritto.
              <br />
              Le parole restano, anche quando non aprono carteggi.
            </p>
          </header>

          {totale === 0 && (
            <div className="text-center py-16 px-6 border border-rule rounded-lg">
              <p className="font-serif italic text-lg text-ink-soft leading-relaxed">
                Non hai ancora scambiato echi.
                <br />
                Carteggio è giovane, e si abita lentamente.
              </p>
            </div>
          )}

          {echiInviati.length > 0 && (
            <section className="mb-16">
              <h2 className="font-sans text-xs tracking-widest uppercase text-ink-faded mb-6">
                Echi che hai inviato ({echiInviati.length})
              </h2>
              <div className="space-y-10">
                {echiInviati.map((e) => (
                  <EcoCard key={e.id} eco={e} direzione="inviato" />
                ))}
              </div>
            </section>
          )}

          {echiRicevuti.length > 0 && (
            <section>
              <h2 className="font-sans text-xs tracking-widest uppercase text-ink-faded mb-6">
                Echi che hai ricevuto ({echiRicevuti.length})
              </h2>
              <div className="space-y-10">
                {echiRicevuti.map((e) => (
                  <EcoCard key={e.id} eco={e} direzione="ricevuto" />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

function EcoCard({
  eco,
  direzione,
}: {
  eco: EcoStorico;
  direzione: "inviato" | "ricevuto";
}) {
  const altro = eco.altraPersona;
  const preposizione = direzione === "inviato" ? "a" : "da";
  const nome = altro?.nome_battesimo ?? "utente non più presente";
  const fascia = altro?.fascia_eta;

  return (
    <article className="border-b border-rule pb-10 last:border-b-0">
      <p className="font-sans text-xs tracking-widest uppercase text-ink-faded mb-3">
        {preposizione} {nome}
        {fascia && <span>, {fascia}</span>} · {formatRelativeDate(eco.created_at)}
      </p>

      <blockquote className="font-serif italic text-lg leading-relaxed text-ink border-l-2 border-accent pl-5">
        {eco.testo}
      </blockquote>

      {eco.pezzo && (
        <details className="mt-4">
          <summary className="font-sans text-xs tracking-widest uppercase text-ink-faded cursor-pointer hover:text-accent">
            sul pezzo {direzione === "inviato" ? `di ${nome}` : "tuo"}
          </summary>
          <div
            className={`mt-3 font-serif whitespace-pre-line leading-relaxed text-ink-soft ${
              eco.pezzo.formato === "sei-parole"
                ? "text-base text-center"
                : eco.pezzo.formato === "ricordo" || eco.pezzo.formato === "luogo"
                  ? "italic text-base"
                  : "text-base"
            }`}
          >
            <span className="block text-xs uppercase tracking-widest text-ink-faded mb-2 not-italic">
              {FORMATO_LABEL[eco.pezzo.formato as FormatoPezzo]}
            </span>
            {eco.pezzo.contenuto_testo}
          </div>
        </details>
      )}

      <div className="mt-5 flex items-baseline justify-between gap-3">
        <p className="font-serif italic text-sm text-ink-faded">
          {STATO_LABEL[eco.stato] ?? eco.stato}
        </p>
        {eco.carteggioId && (
          <Link
            href={`/carteggi/${eco.carteggioId}`}
            className="font-sans text-xs tracking-widest uppercase text-accent hover:text-ink transition-colors"
          >
            vai al carteggio →
          </Link>
        )}
      </div>
    </article>
  );
}

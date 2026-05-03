import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/profile";
import { FORMATO_LABEL, type FormatoPezzo } from "@/lib/formati";
import { formatRelativeDate } from "@/lib/date";
import Nav from "@/app/components/nav";
import { archiviaEco } from "./actions";

export const dynamic = "force-dynamic";

type EcoInAttesa = {
  id: string;
  testo: string;
  created_at: string;
  pezzo: {
    id: string;
    formato: string;
    contenuto_testo: string | null;
  } | null;
  mittente: {
    nome_battesimo: string;
    fascia_eta: string;
  } | null;
};

type CarteggioRecord = {
  id: string;
  partecipante_a_id: string;
  partecipante_b_id: string;
  ultimo_messaggio_at: string | null;
  created_at: string;
  stato: string;
  partecipante_a: { nome_battesimo: string; fascia_eta: string } | null;
  partecipante_b: { nome_battesimo: string; fascia_eta: string } | null;
};

export default async function CarteggiPage() {
  const { user, profile } = await getCurrentProfile();
  if (!user) redirect("/login");
  if (!profile) redirect("/onboarding/eta");

  const supabase = createClient();

  // 1. Echi ricevuti in attesa di risposta (i miei pezzi)
  const { data: echiRaw } = await supabase
    .from("echi")
    .select(
      `
      id, testo, created_at, stato,
      pezzo:pezzi!pezzo_id ( id, formato, contenuto_testo, autore_id ),
      mittente:users!mittente_id ( nome_battesimo, fascia_eta )
    `
    )
    .eq("stato", "in_attesa")
    .order("created_at", { ascending: false });

  const echiInAttesa = ((echiRaw ?? []) as unknown as (EcoInAttesa & {
    pezzo: { autore_id: string } | null;
  })[]).filter((e) => e.pezzo && e.pezzo.autore_id === user.id);

  // 2. Carteggi attivi
  const { data: carteggiRaw } = await supabase
    .from("carteggi")
    .select(
      `
      id, partecipante_a_id, partecipante_b_id, ultimo_messaggio_at, created_at, stato,
      partecipante_a:users!partecipante_a_id ( nome_battesimo, fascia_eta ),
      partecipante_b:users!partecipante_b_id ( nome_battesimo, fascia_eta )
    `
    )
    .eq("stato", "attivo")
    .order("ultimo_messaggio_at", { ascending: false, nullsFirst: false });

  const carteggi = (carteggiRaw ?? []) as unknown as CarteggioRecord[];

  return (
    <div className="min-h-screen flex flex-col">
      <Nav active="carteggi" />
      <main className="flex-1 px-6 py-12 pb-32">
        <div className="max-w-xl mx-auto">
          <header className="text-center mb-12">
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-ink-faded mb-3">
              carteggi
            </p>
            <h1 className="font-serif text-4xl md:text-5xl font-medium leading-none">
              La tua posta.
            </h1>
            <p className="font-serif italic text-base text-ink-soft mt-3">
              Echi da leggere, conversazioni in corso.
            </p>
          </header>

          {echiInAttesa.length === 0 && carteggi.length === 0 && (
            <div className="text-center py-16 px-6 border border-rule rounded-lg">
              <p className="font-serif italic text-lg text-ink-soft leading-relaxed">
                Niente echi, nessun carteggio aperto.
                <br />
                Carteggio è giovane, e si abita lentamente.
              </p>
            </div>
          )}

          {/* Echi in attesa */}
          {echiInAttesa.length > 0 && (
            <section className="mb-16">
              <h2 className="font-sans text-xs tracking-widest uppercase text-ink-faded mb-6">
                Echi in attesa di risposta
              </h2>
              <div className="space-y-10">
                {echiInAttesa.map((e) => (
                  <article
                    key={e.id}
                    className="border-b border-rule pb-10 last:border-b-0"
                  >
                    <p className="font-sans text-xs tracking-widest uppercase text-ink-faded mb-3">
                      da {e.mittente?.nome_battesimo ?? "anonimo"}
                      {e.mittente?.fascia_eta && (
                        <span>, {e.mittente.fascia_eta}</span>
                      )}{" "}
                      · {formatRelativeDate(e.created_at)}
                    </p>

                    <blockquote className="font-serif italic text-xl leading-relaxed text-ink border-l-2 border-accent pl-5">
                      {e.testo}
                    </blockquote>

                    <details className="mt-5">
                      <summary className="font-sans text-xs tracking-widest uppercase text-ink-faded cursor-pointer hover:text-accent">
                        sul tuo pezzo
                      </summary>
                      {e.pezzo && (
                        <div
                          className={`mt-3 font-serif whitespace-pre-line leading-relaxed text-ink-soft ${
                            e.pezzo.formato === "sei-parole"
                              ? "text-base text-center"
                              : e.pezzo.formato === "ricordo" ||
                                  e.pezzo.formato === "luogo"
                                ? "italic text-base"
                                : "text-base"
                          }`}
                        >
                          <span className="block text-xs uppercase tracking-widest text-ink-faded mb-2 not-italic">
                            {FORMATO_LABEL[e.pezzo.formato as FormatoPezzo]}
                          </span>
                          {e.pezzo.contenuto_testo}
                        </div>
                      )}
                    </details>

                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                      <Link
                        href={`/carteggi/nuovo?eco=${e.id}`}
                        className="flex-1 text-center font-sans text-sm tracking-[0.25em] uppercase text-paper bg-accent rounded-full px-6 py-2.5 hover:bg-ink transition-colors"
                      >
                        rispondi
                      </Link>
                      <form action={archiviaEco} className="flex-1">
                        <input type="hidden" name="ecoId" value={e.id} />
                        <button
                          type="submit"
                          className="w-full font-sans text-sm tracking-[0.25em] uppercase text-ink-faded border border-rule rounded-full px-6 py-2.5 hover:border-accent hover:text-accent transition-colors"
                        >
                          non rispondere
                        </button>
                      </form>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Carteggi attivi */}
          {carteggi.length > 0 && (
            <section>
              <h2 className="font-sans text-xs tracking-widest uppercase text-ink-faded mb-6">
                Conversazioni aperte
              </h2>
              <div className="space-y-3">
                {carteggi.map((c) => {
                  const altro =
                    c.partecipante_a_id === user.id
                      ? c.partecipante_b
                      : c.partecipante_a;
                  return (
                    <Link
                      key={c.id}
                      href={`/carteggi/${c.id}`}
                      className="block p-5 border border-rule rounded-lg hover:border-accent transition-colors"
                    >
                      <div className="flex items-baseline justify-between">
                        <h3 className="font-serif text-xl font-medium">
                          {altro?.nome_battesimo ?? "anonimo"}
                          {altro?.fascia_eta && (
                            <span className="font-serif italic text-base text-ink-faded ml-2">
                              {altro.fascia_eta}
                            </span>
                          )}
                        </h3>
                        <span className="font-serif italic text-xs text-ink-faded">
                          {c.ultimo_messaggio_at
                            ? formatRelativeDate(c.ultimo_messaggio_at)
                            : formatRelativeDate(c.created_at)}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

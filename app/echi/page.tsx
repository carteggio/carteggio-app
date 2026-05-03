import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/profile";
import { FORMATO_LABEL, type FormatoPezzo } from "@/lib/formati";
import { formatRelativeDate } from "@/lib/date";
import Nav from "@/app/components/nav";
import { archiviaEco } from "./actions";

export const dynamic = "force-dynamic";

type EcoRicevuto = {
  id: string;
  testo: string;
  stato: "in_attesa" | "risposto" | "non_risposto" | "archiviato";
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

export default async function EchiPage() {
  const { user, profile } = await getCurrentProfile();
  if (!user) redirect("/login");
  if (!profile) redirect("/onboarding/eta");

  const supabase = createClient();

  // Carico tutti gli echi su pezzi miei
  const { data: echi } = await supabase
    .from("echi")
    .select(
      `
      id,
      testo,
      stato,
      created_at,
      pezzo:pezzi!pezzo_id (
        id,
        formato,
        contenuto_testo,
        autore_id
      ),
      mittente:users!mittente_id (
        nome_battesimo,
        fascia_eta
      )
    `
    )
    .order("created_at", { ascending: false });

  // Filtro lato applicativo: solo echi su pezzi miei (RLS già lo fa, ma per sicurezza)
  const items = ((echi ?? []) as unknown as EcoRicevuto[]).filter(
    (e) => e.pezzo !== null
  );

  const inAttesa = items.filter((e) => e.stato === "in_attesa");
  const passati = items.filter(
    (e) => e.stato === "risposto" || e.stato === "non_risposto"
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Nav active="echi" />
      <main className="flex-1 px-6 py-12">
        <div className="max-w-xl mx-auto">
          <header className="text-center mb-12">
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-ink-faded mb-3">
              i tuoi echi · ricevuti
            </p>
            <h1 className="font-serif text-4xl md:text-5xl font-medium leading-none">
              Cose che hanno scritto.
            </h1>
            <p className="font-serif italic text-base text-ink-soft mt-3">
              Leggendo i tuoi pezzi.
            </p>
          </header>

          {items.length === 0 && (
            <div className="text-center py-16 px-6 border border-rule rounded-lg">
              <p className="font-serif italic text-lg text-ink-soft leading-relaxed">
                Nessuno ti ha ancora scritto un eco.
                <br />
                Carteggio è giovane, e si abita lentamente.
              </p>
            </div>
          )}

          {inAttesa.length > 0 && (
            <section className="space-y-10">
              {inAttesa.map((e) => (
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
                    <div
                      className={`mt-3 font-serif whitespace-pre-line leading-relaxed text-ink-soft ${
                        e.pezzo?.formato === "sei-parole"
                          ? "text-base text-center"
                          : e.pezzo?.formato === "ricordo" ||
                              e.pezzo?.formato === "luogo"
                            ? "italic text-base"
                            : "text-base"
                      }`}
                    >
                      <span className="block text-xs uppercase tracking-widest text-ink-faded mb-2 not-italic">
                        {FORMATO_LABEL[e.pezzo!.formato as FormatoPezzo]}
                      </span>
                      {e.pezzo!.contenuto_testo}
                    </div>
                  </details>

                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <Link
                      href={`/carteggio/nuovo?eco=${e.id}`}
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
            </section>
          )}

          {passati.length > 0 && (
            <section className="mt-16">
              <h2 className="font-sans text-xs tracking-widest uppercase text-ink-faded mb-6">
                già letti
              </h2>
              <div className="space-y-6">
                {passati.map((e) => (
                  <article
                    key={e.id}
                    className="opacity-60 border-l-2 border-rule pl-4 py-2"
                  >
                    <p className="font-sans text-xs tracking-widest uppercase text-ink-faded mb-2">
                      da {e.mittente?.nome_battesimo ?? "anonimo"} ·{" "}
                      {e.stato === "risposto" ? "risposto" : "non risposto"}
                    </p>
                    <p className="font-serif italic text-sm text-ink-soft">
                      {e.testo}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/profile";
import { FORMATO_LABEL, type FormatoPezzo } from "@/lib/formati";
import { formatRelativeDate } from "@/lib/date";
import Nav from "@/app/components/nav";

export const dynamic = "force-dynamic";

type FeedItem = {
  id: string;
  formato: string;
  contenuto_testo: string | null;
  created_at: string;
  autore: {
    nome_battesimo: string;
    fascia_eta: string;
  } | null;
};

export default async function FeedPage() {
  const { user, profile } = await getCurrentProfile();
  if (!user) redirect("/login");
  if (!profile) redirect("/onboarding/eta");

  const supabase = createClient();
  const { data: pezzi, error } = await supabase
    .from("pezzi")
    .select(
      `
      id, formato, contenuto_testo, created_at,
      autore:users!autore_id ( nome_battesimo, fascia_eta )
    `
    )
    .eq("stato", "visibile")
    .neq("autore_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: echiInviati } = await supabase
    .from("echi")
    .select("pezzo_id")
    .eq("mittente_id", user.id);

  const pezziGiaEcoati = new Set((echiInviati ?? []).map((e) => e.pezzo_id));
  const items = (pezzi ?? []) as unknown as FeedItem[];

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 px-6 py-12 pb-32">
        <div className="max-w-xl mx-auto">
          <header className="text-center mb-12">
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-ink-faded mb-3">
              {profile.citta.toLowerCase()} · oggi
            </p>
            <h1 className="font-serif text-4xl md:text-5xl font-medium leading-none">
              Le voci di oggi.
            </h1>
            <p className="font-serif italic text-base text-ink-soft mt-3">
              Pezzi scritti dalle persone della tua città.
            </p>
          </header>

          {error && (
            <div className="text-center py-12">
              <p className="font-serif italic text-ink-soft">
                Qualcosa non ha funzionato nel caricamento del feed.
              </p>
              <p className="font-mono text-xs text-ink-faded mt-2">
                {error.message}
              </p>
            </div>
          )}

          {!error && items.length === 0 && (
            <div className="text-center py-16 px-6 border border-rule rounded-lg">
              <p className="font-serif italic text-lg text-ink-soft leading-relaxed">
                Nessun pezzo da leggere oggi nella tua città.
                <br />
                Carteggio è giovane, e si abita lentamente.
              </p>
              <p className="font-serif italic text-sm text-ink-faded mt-6">
                Torna domani, oppure
              </p>
              <Link
                href="/scrivi"
                className="inline-block mt-4 font-sans text-sm tracking-[0.25em] uppercase text-accent border border-accent rounded-full px-6 py-2 hover:bg-accent hover:text-paper transition-colors"
              >
                scrivi tu un pezzo
              </Link>
            </div>
          )}

          {items.length > 0 && (
            <div className="space-y-12">
              {items.map((p) => {
                const giaEcoato = pezziGiaEcoati.has(p.id);
                return (
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
                    <div className="mt-6 flex items-baseline justify-between">
                      <p className="font-serif italic text-sm text-ink-soft">
                        — {p.autore?.nome_battesimo ?? "anonimo"}
                        {p.autore?.fascia_eta && (
                          <span className="text-ink-faded">
                            , {p.autore.fascia_eta}
                          </span>
                        )}
                      </p>
                      <p className="font-serif italic text-xs text-ink-faded">
                        {formatRelativeDate(p.created_at)}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      {giaEcoato ? (
                        <p className="font-serif italic text-sm text-ink-faded">
                          Hai già lasciato un eco a questo pezzo.
                        </p>
                      ) : (
                        <Link
                          href={`/eco/${p.id}`}
                          className="inline-block font-sans text-xs tracking-widest uppercase text-accent border border-accent rounded-full px-5 py-2 hover:bg-accent hover:text-paper transition-colors"
                        >
                          lascia un eco
                        </Link>
                      )}
                      <Link
                        href={`/segnala?tipo=pezzo&id=${p.id}`}
                        className="font-sans text-[10px] tracking-widest uppercase text-ink-faded hover:text-accent transition-colors"
                      >
                        segnala
                      </Link>
                    </div>
                  </article>
                );
              })}

              <div className="text-center pt-4">
                <p className="font-serif italic text-sm text-ink-faded">
                  {items.length === 10
                    ? "Per oggi basta. Torna domani."
                    : "Hai letto i pezzi del giorno."}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

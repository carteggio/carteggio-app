import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/profile";
import { FORMATO_LABEL, type FormatoPezzo } from "@/lib/formati";

export const dynamic = "force-dynamic";

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return "ora";
  if (diffSec < 3600) {
    const m = Math.floor(diffSec / 60);
    return m === 1 ? "un minuto fa" : `${m} minuti fa`;
  }
  if (diffSec < 86400) {
    const h = Math.floor(diffSec / 3600);
    return h === 1 ? "un'ora fa" : `${h} ore fa`;
  }
  if (diffSec < 604800) {
    const d = Math.floor(diffSec / 86400);
    return d === 1 ? "ieri" : `${d} giorni fa`;
  }
  return date.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function ProfiloPage() {
  const { user, profile } = await getCurrentProfile();
  if (!user) redirect("/login");
  if (!profile) redirect("/onboarding/eta");

  const supabase = createClient();
  const { data: pezzi } = await supabase
    .from("pezzi")
    .select("id, formato, contenuto_testo, created_at")
    .eq("autore_id", user.id)
    .eq("stato", "visibile")
    .order("created_at", { ascending: false });

  const numeroPezzi = pezzi?.length ?? 0;

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-xl mx-auto">
        {/* Header profilo */}
        <header className="text-center mb-16">
          <p className="font-sans text-xs tracking-[0.3em] uppercase text-ink-faded mb-4">
            il tuo carteggio · {profile.citta.toLowerCase()}
          </p>
          <h1 className="font-serif text-5xl md:text-6xl font-medium leading-none">
            {profile.nome_battesimo}
          </h1>
          <p className="font-serif italic text-lg text-ink-soft mt-3">
            {profile.fascia_eta} anni
          </p>
          <p className="font-sans text-xs tracking-widest uppercase text-ink-faded mt-6">
            {numeroPezzi} {numeroPezzi === 1 ? "pezzo" : "pezzi"} pubblicato
            {numeroPezzi === 1 ? "" : "i"}
          </p>
        </header>

        {/* Lista pezzi */}
        {numeroPezzi === 0 ? (
          <p className="font-serif italic text-center text-ink-faded">
            Non hai ancora pezzi.
          </p>
        ) : (
          <div className="space-y-12">
            {pezzi?.map((p) => (
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
                <p className="font-serif italic text-sm text-ink-faded mt-4">
                  {formatRelativeDate(p.created_at)}
                </p>
              </article>
            ))}
          </div>
        )}

        {/* Action: scrivi nuovo pezzo */}
        <div className="text-center mt-16">
          {numeroPezzi < 5 ? (
            <Link
              href="/scrivi"
              className="inline-block font-sans text-sm tracking-[0.25em] uppercase text-accent border border-accent rounded-full px-8 py-3 hover:bg-accent hover:text-paper transition-colors"
            >
              + scrivi un nuovo pezzo
            </Link>
          ) : (
            <p className="font-serif italic text-sm text-ink-faded">
              Hai raggiunto il limite di 5 pezzi.
              <br />
              Per scriverne uno nuovo, eliminane uno (a presto).
            </p>
          )}
        </div>

        {/* Logout */}
        <form action="/auth/logout" method="POST" className="mt-16 text-center">
          <button
            type="submit"
            className="font-sans text-xs tracking-widest uppercase text-ink-faded hover:text-accent transition-colors"
          >
            esci
          </button>
        </form>
      </div>
    </main>
  );
}

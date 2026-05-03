import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/profile";
import { FORMATO_LABEL, type FormatoPezzo } from "@/lib/formati";
import { formatRelativeDate } from "@/lib/date";
import Nav from "@/app/components/nav";

export const dynamic = "force-dynamic";

function pezziLabel(n: number): string {
  if (n === 0) return "ancora nessun pezzo";
  if (n === 1) return "1 pezzo pubblicato";
  return `${n} pezzi pubblicati`;
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
    <div className="min-h-screen flex flex-col">
      <Nav active="profilo" />
      <main className="flex-1 px-6 py-12 pb-32">
        <div className="max-w-xl mx-auto">
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

            {/* Foto profilo: visibile solo a te */}
            <div className="mt-8 flex flex-col items-center gap-3">
              {profile.foto_url ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={profile.foto_url}
                    alt="La tua foto"
                    className="w-32 h-32 object-cover rounded-full border border-rule"
                  />
                  <Link
                    href="/profilo/foto"
                    className="font-sans text-xs tracking-widest uppercase text-ink-faded hover:text-accent transition-colors"
                  >
                    cambia o rimuovi foto
                  </Link>
                </>
              ) : (
                <Link
                  href="/profilo/foto"
                  className="font-sans text-xs tracking-widest uppercase text-ink-faded border border-rule rounded-full px-5 py-2 hover:border-accent hover:text-accent transition-colors"
                >
                  + carica una foto (facoltativa)
                </Link>
              )}
            </div>

            <p className="font-sans text-xs tracking-widest uppercase text-ink-faded mt-8">
              {pezziLabel(numeroPezzi)}
            </p>
          </header>

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
              </p>
            )}
          </div>

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
    </div>
  );
}

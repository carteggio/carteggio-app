import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/profile";
import Nav from "@/app/components/nav";
import NotificationToggle from "@/app/components/notification-toggle";
import InstallPrompt from "@/app/components/install-prompt";
import PezziList from "./pezzi-list";
import type { PezzoMin } from "./actions";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

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

  // Prima pagina di pezzi (max PAGE_SIZE) + count totale.
  // I pezzi successivi vengono caricati lato client da PezziList tramite la
  // server action loadMorePezzi(offset), così il primo render della pagina
  // resta veloce anche per utenti con centinaia di pezzi.
  const [{ data: pezziPagina }, { count: numeroPezzi }] = await Promise.all([
    supabase
      .from("pezzi")
      .select("id, formato, contenuto_testo, created_at")
      .eq("autore_id", user.id)
      .eq("stato", "visibile")
      .order("created_at", { ascending: false })
      .range(0, PAGE_SIZE - 1),
    supabase
      .from("pezzi")
      .select("id", { count: "exact", head: true })
      .eq("autore_id", user.id)
      .eq("stato", "visibile"),
  ]);

  const initialPezzi = (pezziPagina ?? []) as PezzoMin[];
  const totale = numeroPezzi ?? 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />

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
              {pezziLabel(totale)}
            </p>
          </header>

          {totale === 0 ? (
            <p className="font-serif italic text-center text-ink-faded">
              Non hai ancora pezzi.
            </p>
          ) : (
            <PezziList initialPezzi={initialPezzi} totale={totale} />
          )}

          <div className="text-center mt-16">
            <Link
              href="/scrivi"
              className="inline-block font-sans text-sm tracking-[0.25em] uppercase text-accent border border-accent rounded-full px-8 py-3 hover:bg-accent hover:text-paper transition-colors"
            >
              + scrivi un nuovo pezzo
            </Link>
          </div>

          {/* Sezione impostazioni: install + notifiche */}
          <div className="mt-16 pt-8 border-t border-rule space-y-4">
            <InstallPrompt />
            <NotificationToggle />
          </div>

          {/* Sezione amministrazione (solo per admin) */}
          {profile.is_admin && (
            <div className="mt-8 text-center">
              <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-3">
                amministrazione
              </p>
              <Link
                href="/admin/segnalazioni"
                className="inline-block font-sans text-sm tracking-widest uppercase text-ink-faded border border-rule rounded-full px-5 py-2 hover:border-accent hover:text-accent transition-colors"
              >
                gestisci segnalazioni
              </Link>
            </div>
          )}

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

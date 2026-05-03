import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/profile";
import { canSendMessage } from "@/lib/carteggio-server";
import { SLOW_PHASE_MESSAGGI } from "@/lib/carteggio";
import { formatRelativeDate } from "@/lib/date";
import Nav from "@/app/components/nav";
import MessaggioForm from "./messaggio-form";

export const dynamic = "force-dynamic";

type Messaggio = {
  id: string;
  mittente_id: string;
  tipo: string;
  contenuto_testo: string | null;
  contenuto_audio_url: string | null;
  created_at: string;
};

export default async function CarteggioPage({
  params,
}: {
  params: { id: string };
}) {
  const { user, profile } = await getCurrentProfile();
  if (!user) redirect("/login");
  if (!profile) redirect("/onboarding/eta");

  const supabase = createClient();

  // Carica carteggio
  const { data: carteggio } = await supabase
    .from("carteggi")
    .select(
      `
      id, partecipante_a_id, partecipante_b_id, stato,
      eco_origine_id, created_at,
      a:users!partecipante_a_id ( nome_battesimo, fascia_eta ),
      b:users!partecipante_b_id ( nome_battesimo, fascia_eta )
    `
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!carteggio) notFound();

  if (
    carteggio.partecipante_a_id !== user.id &&
    carteggio.partecipante_b_id !== user.id
  ) {
    notFound();
  }

  // Carica eco di origine (read-only, mostrato in cima)
  const { data: ecoOrigine } = await supabase
    .from("echi")
    .select("id, testo, mittente_id")
    .eq("id", carteggio.eco_origine_id)
    .maybeSingle();

  // Carica messaggi
  const { data: messaggiRaw } = await supabase
    .from("messaggi")
    .select("id, mittente_id, tipo, contenuto_testo, contenuto_audio_url, created_at")
    .eq("carteggio_id", params.id)
    .order("created_at", { ascending: true });

  const messaggi = (messaggiRaw ?? []) as Messaggio[];

  // Identifica nomi
  const a = carteggio.a as unknown as { nome_battesimo: string; fascia_eta: string } | null;
  const b = carteggio.b as unknown as { nome_battesimo: string; fascia_eta: string } | null;
  const altro =
    carteggio.partecipante_a_id === user.id ? b : a;

  function nomeDi(mittente_id: string): string {
    if (mittente_id === user!.id) return profile!.nome_battesimo;
    if (mittente_id === carteggio!.partecipante_a_id)
      return a?.nome_battesimo ?? "anonimo";
    return b?.nome_battesimo ?? "anonimo";
  }

  // Stato del compose
  const sendCheck = canSendMessage({
    messages: messaggi.map((m) => ({
      id: m.id,
      mittente_id: m.mittente_id,
      created_at: m.created_at,
    })),
    currentUserId: user.id,
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Nav active="carteggi" />
      <main className="flex-1 px-6 py-8 pb-32">
        <div className="max-w-xl mx-auto">
          <Link
            href="/carteggi"
            className="font-sans text-xs tracking-widest uppercase text-ink-faded hover:text-accent transition-colors"
          >
            ← carteggi
          </Link>

          <header className="text-center my-10">
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-ink-faded mb-2">
              carteggio con
            </p>
            <h1 className="font-serif text-4xl md:text-5xl font-medium leading-none">
              {altro?.nome_battesimo ?? "anonimo"}
              {altro?.fascia_eta && (
                <span className="font-serif italic text-xl text-ink-faded ml-3">
                  {altro.fascia_eta}
                </span>
              )}
            </h1>
            <p className="font-sans text-xs tracking-widest uppercase text-ink-faded mt-4">
              {sendCheck.phase === "slow"
                ? `lettera ${messaggi.length} di ${SLOW_PHASE_MESSAGGI}`
                : "chat libera"}
            </p>
          </header>

          {/* Eco di origine (collassato) */}
          {ecoOrigine && (
            <details className="mb-10 border border-rule rounded-lg p-4 bg-paper-deep">
              <summary className="font-sans text-xs tracking-widest uppercase text-ink-faded cursor-pointer hover:text-accent">
                eco di partenza
              </summary>
              <blockquote className="mt-3 font-serif italic text-base leading-relaxed text-ink border-l-2 border-accent pl-4">
                {ecoOrigine.testo}
              </blockquote>
            </details>
          )}

          {/* Messaggi come lettere */}
          {messaggi.length === 0 ? (
            <p className="font-serif italic text-center text-ink-faded">
              Il carteggio è vuoto.
            </p>
          ) : (
            <div className="space-y-12 mb-12">
              {messaggi.map((m, idx) => (
                <article key={m.id}>
                  <p className="font-sans text-xs tracking-widest uppercase text-ink-faded mb-3">
                    {nomeDi(m.mittente_id)} ·{" "}
                    {formatRelativeDate(m.created_at)}
                    {sendCheck.phase === "slow" && idx < SLOW_PHASE_MESSAGGI && (
                      <span className="ml-2 text-accent">
                        · lettera {idx + 1} di {SLOW_PHASE_MESSAGGI}
                      </span>
                    )}
                  </p>
                  <div className="font-serif text-lg leading-relaxed whitespace-pre-line text-ink">
                    {m.contenuto_testo}
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Form di invio */}
          <div className="border-t border-rule pt-8">
            {sendCheck.canSend ? (
              <MessaggioForm
                carteggioId={carteggio.id}
                phase={sendCheck.phase}
                minLength={sendCheck.minLength}
                maxLength={sendCheck.maxLength}
              />
            ) : (
              <p className="font-serif italic text-center text-ink-soft leading-relaxed">
                {sendCheck.reason}
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

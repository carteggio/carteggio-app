import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/profile";
import { FORMATO_LABEL, type FormatoPezzo } from "@/lib/formati";
import Nav from "@/app/components/nav";
import PrimaLetteraForm from "./prima-lettera-form";

export const dynamic = "force-dynamic";

export default async function NuovoCarteggioPage({
  searchParams,
}: {
  searchParams: { eco?: string };
}) {
  const { user, profile } = await getCurrentProfile();
  if (!user) redirect("/login");
  if (!profile) redirect("/onboarding/eta");

  if (!searchParams.eco) redirect("/carteggi");

  const supabase = createClient();

  const { data: eco } = await supabase
    .from("echi")
    .select(
      `
      id, testo, stato, mittente_id, pezzo_id, created_at,
      pezzo:pezzi!pezzo_id ( id, formato, contenuto_testo, autore_id ),
      mittente:users!mittente_id ( nome_battesimo, fascia_eta )
    `
    )
    .eq("id", searchParams.eco)
    .maybeSingle();

  if (!eco) notFound();

  const pezzo = eco.pezzo as unknown as {
    id: string;
    formato: string;
    contenuto_testo: string | null;
    autore_id: string;
  } | null;
  const mittente = eco.mittente as unknown as {
    nome_battesimo: string;
    fascia_eta: string;
  } | null;

  if (!pezzo || pezzo.autore_id !== user.id) {
    return (
      <div className="min-h-screen flex flex-col">
        <Nav active="carteggi" />
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 pb-32">
          <div className="max-w-md text-center">
            <h1 className="font-serif text-3xl font-medium">
              Eco non disponibile.
            </h1>
            <Link
              href="/carteggi"
              className="inline-block mt-12 font-sans text-sm tracking-[0.25em] uppercase text-accent border border-accent rounded-full px-8 py-3"
            >
              torna ai carteggi
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Se esiste già un carteggio per questo eco, redirect lì.
  const { data: carteggioEsistente } = await supabase
    .from("carteggi")
    .select("id")
    .eq("eco_origine_id", eco.id)
    .maybeSingle();

  if (carteggioEsistente) {
    redirect(`/carteggi/${carteggioEsistente.id}`);
  }

  // Se esiste già un carteggio attivo tra le due persone (anche da un'altra
  // eco), vincolo di prodotto: max 1 attivo per coppia. Marchiamo l'eco come
  // "risposto" (la persona ha preso atto) e redirigiamo al carteggio esistente.
  // NB: due query separate per evitare ambiguità della sintassi .or() di
  // PostgREST con and() annidati.
  const eco_mittente = (eco as { mittente_id: string }).mittente_id;
  const [{ data: carteggioAB }, { data: carteggioBA }] = await Promise.all([
    supabase
      .from("carteggi")
      .select("id")
      .eq("stato", "attivo")
      .eq("partecipante_a_id", user.id)
      .eq("partecipante_b_id", eco_mittente)
      .maybeSingle(),
    supabase
      .from("carteggi")
      .select("id")
      .eq("stato", "attivo")
      .eq("partecipante_a_id", eco_mittente)
      .eq("partecipante_b_id", user.id)
      .maybeSingle(),
  ]);

  const carteggioAttivoCoppia = carteggioAB ?? carteggioBA;
  if (carteggioAttivoCoppia) {
    await supabase.from("echi").update({ stato: "risposto" }).eq("id", eco.id);
    redirect(`/carteggi/${carteggioAttivoCoppia.id}`);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Nav active="carteggi" />
      <main className="flex-1 px-6 py-12 pb-32">
        <div className="max-w-md mx-auto">
          <Link
            href="/carteggi"
            className="font-sans text-xs tracking-widest uppercase text-ink-faded hover:text-accent transition-colors"
          >
            ← annulla
          </Link>

          <header className="text-center my-12">
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-ink-faded mb-3">
              risposta a {mittente?.nome_battesimo ?? "anonimo"}
            </p>
            <h1 className="font-serif text-3xl font-medium leading-tight">
              La prima lettera.
            </h1>
            <p className="font-serif italic text-base text-ink-soft mt-3 leading-relaxed">
              Apri il carteggio rispondendo a questo eco.
              <br />
              Almeno duecento caratteri. Una volta partita,
              <br />
              {mittente?.nome_battesimo ?? "lui"} avrà 24 ore per leggerla.
            </p>
          </header>

          {/* Eco a cui rispondi (read-only) */}
          <article className="border border-rule rounded-lg p-5 bg-paper-deep mb-4">
            <p className="font-sans text-xs tracking-widest uppercase text-ink-faded mb-3">
              eco di {mittente?.nome_battesimo ?? "anonimo"}
              {mittente?.fascia_eta && <span>, {mittente.fascia_eta}</span>}
            </p>
            <blockquote className="font-serif italic text-lg leading-relaxed text-ink border-l-2 border-accent pl-4">
              {eco.testo}
            </blockquote>
          </article>

          <details className="mb-8 px-2">
            <summary className="font-sans text-xs tracking-widest uppercase text-ink-faded cursor-pointer hover:text-accent">
              sul tuo pezzo
            </summary>
            <div
              className={`mt-3 font-serif whitespace-pre-line leading-relaxed text-ink-soft ${
                pezzo.formato === "sei-parole"
                  ? "text-base text-center"
                  : pezzo.formato === "ricordo" || pezzo.formato === "luogo"
                    ? "italic text-base"
                    : "text-base"
              }`}
            >
              <span className="block text-xs uppercase tracking-widest text-ink-faded mb-2 not-italic">
                {FORMATO_LABEL[pezzo.formato as FormatoPezzo]}
              </span>
              {pezzo.contenuto_testo}
            </div>
          </details>

          <PrimaLetteraForm ecoId={eco.id} mittenteName={mittente?.nome_battesimo ?? null} />
        </div>
      </main>
    </div>
  );
}

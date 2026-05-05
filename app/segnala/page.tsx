import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/profile";
import { FORMATO_LABEL, type FormatoPezzo } from "@/lib/formati";
import Nav from "@/app/components/nav";
import SegnalaForm from "./segnala-form";

export const dynamic = "force-dynamic";

const TIPI_VALIDI = ["pezzo", "eco", "utente"] as const;

export default async function SegnalaPage({
  searchParams,
}: {
  searchParams: { tipo?: string; id?: string };
}) {
  const { user, profile } = await getCurrentProfile();
  if (!user) redirect("/login");
  if (!profile) redirect("/onboarding/eta");

  const { tipo, id } = searchParams;
  if (
    !tipo ||
    !id ||
    !TIPI_VALIDI.includes(tipo as (typeof TIPI_VALIDI)[number])
  ) {
    notFound();
  }

  const supabase = createClient();

  // Carica anteprima del target per dare contesto
  let anteprima: React.ReactNode = null;

  if (tipo === "pezzo") {
    const { data: pezzo } = await supabase
      .from("pezzi")
      .select(
        "id, formato, contenuto_testo, autore:users!autore_id(nome_battesimo, fascia_eta)"
      )
      .eq("id", id)
      .maybeSingle();
    if (pezzo) {
      const autore = pezzo.autore as unknown as {
        nome_battesimo: string;
        fascia_eta: string;
      } | null;
      anteprima = (
        <article className="border border-rule rounded-lg p-5 bg-paper-deep">
          <p className="font-sans text-xs tracking-widest uppercase text-ink-faded mb-2">
            {FORMATO_LABEL[pezzo.formato as FormatoPezzo]} ·{" "}
            {autore?.nome_battesimo ?? "anonimo"}
          </p>
          <div className="font-serif italic text-base text-ink leading-relaxed whitespace-pre-line">
            {pezzo.contenuto_testo}
          </div>
        </article>
      );
    }
  } else if (tipo === "eco") {
    const { data: eco } = await supabase
      .from("echi")
      .select("id, testo, mittente:users!mittente_id(nome_battesimo)")
      .eq("id", id)
      .maybeSingle();
    if (eco) {
      const mit = eco.mittente as unknown as {
        nome_battesimo: string;
      } | null;
      anteprima = (
        <article className="border border-rule rounded-lg p-5 bg-paper-deep">
          <p className="font-sans text-xs tracking-widest uppercase text-ink-faded mb-2">
            eco di {mit?.nome_battesimo ?? "anonimo"}
          </p>
          <blockquote className="font-serif italic text-base text-ink leading-relaxed">
            {eco.testo}
          </blockquote>
        </article>
      );
    }
  } else if (tipo === "utente") {
    const { data: utente } = await supabase
      .from("users")
      .select("nome_battesimo, fascia_eta, citta")
      .eq("id", id)
      .maybeSingle();
    if (utente) {
      anteprima = (
        <article className="border border-rule rounded-lg p-5 bg-paper-deep text-center">
          <p className="font-sans text-xs tracking-widest uppercase text-ink-faded mb-1">
            utente
          </p>
          <p className="font-serif text-2xl font-medium">
            {utente.nome_battesimo}
          </p>
          <p className="font-serif italic text-sm text-ink-faded">
            {utente.fascia_eta} · {utente.citta}
          </p>
        </article>
      );
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 px-6 py-12 pb-32">
        <div className="max-w-md mx-auto">
          <Link
            href="/feed"
            className="font-sans text-xs tracking-widest uppercase text-ink-faded hover:text-accent transition-colors"
          >
            ← annulla
          </Link>

          <header className="text-center my-12">
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-3">
              segnalazione
            </p>
            <h1 className="font-serif text-3xl md:text-4xl font-medium leading-tight">
              C'è qualcosa che non va.
            </h1>
            <p className="font-serif italic text-base text-ink-soft mt-3 leading-relaxed">
              Cosa stai segnalando? Più ci dici,
              <br />
              più rapidamente possiamo capire.
            </p>
          </header>

          {anteprima && <div className="mb-8">{anteprima}</div>}

          <SegnalaForm tipo={tipo} targetId={id} />
        </div>
      </main>
    </div>
  );
}

import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/profile";
import { ECO_LIMITE_GIORNALIERO } from "@/lib/eco";
import { contaEchiOggi } from "@/lib/eco-server";
import { FORMATO_LABEL, type FormatoPezzo } from "@/lib/formati";
import Nav from "@/app/components/nav";
import EcoForm from "./eco-form";

export const dynamic = "force-dynamic";

export default async function EcoPage({ params }: { params: { pezzoId: string } }) {
  const { user, profile } = await getCurrentProfile();
  if (!user) redirect("/login");
  if (!profile) redirect("/onboarding/eta");

  const supabase = createClient();

  const { data: pezzo } = await supabase
    .from("pezzi")
    .select(
      `
      id,
      formato,
      contenuto_testo,
      created_at,
      autore_id,
      autore:users!autore_id (
        nome_battesimo,
        fascia_eta
      )
    `
    )
    .eq("id", params.pezzoId)
    .eq("stato", "visibile")
    .maybeSingle();

  if (!pezzo) notFound();

  if (pezzo.autore_id === user.id) {
    return (
      <div className="min-h-screen flex flex-col">
        <Nav active="feed" />
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
          <div className="max-w-md w-full text-center">
            <h1 className="font-serif text-3xl font-medium leading-tight">
              Questo pezzo è tuo.
            </h1>
            <p className="font-serif italic text-lg text-ink-soft mt-4">
              Non si lascia un eco ai propri pezzi.
            </p>
            <Link
              href="/feed"
              className="inline-block mt-12 font-sans text-sm tracking-[0.25em] uppercase text-accent border border-accent rounded-full px-8 py-3 hover:bg-accent hover:text-paper transition-colors"
            >
              torna al feed
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const { data: ecoEsistente } = await supabase
    .from("echi")
    .select("id")
    .eq("mittente_id", user.id)
    .eq("pezzo_id", pezzo.id)
    .maybeSingle();

  if (ecoEsistente) {
    return (
      <div className="min-h-screen flex flex-col">
        <Nav active="feed" />
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
          <div className="max-w-md w-full text-center">
            <h1 className="font-serif text-3xl font-medium leading-tight">
              Hai già lasciato un eco a questo pezzo.
            </h1>
            <p className="font-serif italic text-lg text-ink-soft mt-4">
              Una volta è abbastanza. Aspetta che venga letto.
            </p>
            <Link
              href="/feed"
              className="inline-block mt-12 font-sans text-sm tracking-[0.25em] uppercase text-accent border border-accent rounded-full px-8 py-3 hover:bg-accent hover:text-paper transition-colors"
            >
              torna al feed
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const echiOggi = await contaEchiOggi(user.id);
  if (echiOggi >= ECO_LIMITE_GIORNALIERO) {
    return (
      <div className="min-h-screen flex flex-col">
        <Nav active="feed" />
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
          <div className="max-w-md w-full text-center">
            <h1 className="font-serif text-3xl font-medium leading-tight">
              Hai già lasciato {ECO_LIMITE_GIORNALIERO} echi oggi.
            </h1>
            <p className="font-serif italic text-lg text-ink-soft mt-4 leading-relaxed">
              Tre al giorno è il limite. Serve a scegliere su chi spendere
              attenzione.
              <br />
              Torna domani.
            </p>
            <Link
              href="/feed"
              className="inline-block mt-12 font-sans text-sm tracking-[0.25em] uppercase text-accent border border-accent rounded-full px-8 py-3 hover:bg-accent hover:text-paper transition-colors"
            >
              torna al feed
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const autore = (pezzo.autore as unknown as {
    nome_battesimo: string;
    fascia_eta: string;
  } | null);

  return (
    <div className="min-h-screen flex flex-col">
      <Nav active="feed" />
      <main className="flex-1 px-6 py-12">
        <div className="max-w-md mx-auto">
          <Link
            href="/feed"
            className="font-sans text-xs tracking-widest uppercase text-ink-faded hover:text-accent transition-colors"
          >
            ← annulla
          </Link>

          <header className="text-center my-12">
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-ink-faded mb-3">
              un eco a un pezzo di {autore?.nome_battesimo ?? "anonimo"}
            </p>
            <h1 className="font-serif text-3xl font-medium leading-tight">
              Lascia un eco.
            </h1>
            <p className="font-serif italic text-base text-ink-soft mt-3 leading-relaxed">
              Per dirgli che l'hai letto, e che ti è rimasto qualcosa.
              <br />
              Solo {autore?.nome_battesimo ?? "lui"} lo leggerà.
            </p>
          </header>

          <article className="border border-rule rounded-lg p-6 bg-paper-deep mb-8">
            <p className="font-sans text-xs tracking-widest uppercase text-ink-faded mb-3">
              {FORMATO_LABEL[pezzo.formato as FormatoPezzo]}
            </p>
            <div
              className={`font-serif whitespace-pre-line leading-relaxed ${
                pezzo.formato === "sei-parole"
                  ? "text-xl text-center"
                  : pezzo.formato === "ricordo" || pezzo.formato === "luogo"
                    ? "italic text-lg"
                    : "text-lg"
              }`}
            >
              {pezzo.contenuto_testo}
            </div>
            <p className="font-serif italic text-sm text-ink-faded mt-4">
              — {autore?.nome_battesimo ?? "anonimo"}
              {autore?.fascia_eta && (
                <span>, {autore.fascia_eta}</span>
              )}
            </p>
          </article>

          <EcoForm pezzoId={pezzo.id} echiOggi={echiOggi} />
        </div>
      </main>
    </div>
  );
}

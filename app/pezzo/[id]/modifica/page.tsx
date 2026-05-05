import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/profile";
import { findFormato, FORMATO_LABEL, type FormatoPezzo } from "@/lib/formati";
import Nav from "@/app/components/nav";
import ModificaForm from "./modifica-form";

export const dynamic = "force-dynamic";

export default async function ModificaPezzoPage({
  params,
}: {
  params: { id: string };
}) {
  const { user, profile } = await getCurrentProfile();
  if (!user) redirect("/login");
  if (!profile) redirect("/onboarding/eta");

  const supabase = createClient();
  const { data: pezzo } = await supabase
    .from("pezzi")
    .select("id, formato, contenuto_testo, autore_id, stato")
    .eq("id", params.id)
    .maybeSingle();

  if (!pezzo) notFound();
  if (pezzo.autore_id !== user.id) notFound();
  if (pezzo.stato !== "visibile") {
    return (
      <div className="min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 pb-32">
          <div className="max-w-md w-full text-center">
            <h1 className="font-serif text-3xl font-medium leading-tight">
              Pezzo non più disponibile.
            </h1>
            <p className="font-serif italic text-lg text-ink-soft mt-4">
              Probabilmente è stato nascosto o segnalato.
            </p>
            <Link
              href="/profilo"
              className="inline-block mt-12 font-sans text-sm tracking-[0.25em] uppercase text-accent border border-accent rounded-full px-8 py-3"
            >
              torna al profilo
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const fmt = findFormato(pezzo.formato);
  if (!fmt) notFound();

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 px-6 py-12 pb-32">
        <div className="max-w-md mx-auto">
          <Link
            href="/profilo"
            className="font-sans text-xs tracking-widest uppercase text-ink-faded hover:text-accent transition-colors"
          >
            ← profilo
          </Link>

          <header className="text-center my-12">
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-ink-faded mb-3">
              modifica pezzo
            </p>
            <h1 className="font-serif text-3xl md:text-4xl font-medium leading-tight">
              {FORMATO_LABEL[pezzo.formato as FormatoPezzo]}
            </h1>
            <p className="font-serif italic text-base text-ink-soft mt-3">
              il formato non si può cambiare,
              <br />
              ma puoi sistemare le parole.
            </p>
          </header>

          <ModificaForm
            pezzoId={pezzo.id}
            formato={pezzo.formato as FormatoPezzo}
            contenutoIniziale={pezzo.contenuto_testo ?? ""}
          />
        </div>
      </main>
    </div>
  );
}

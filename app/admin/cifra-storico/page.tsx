import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCiphertext } from "@/lib/crypto-messaggi";
import Nav from "@/app/components/nav";
import CifraStoricoForm from "./cifra-storico-form";

export const dynamic = "force-dynamic";

export default async function CifraStoricoPage() {
  const { user, profile } = await getCurrentProfile();
  if (!user) redirect("/login");
  if (!profile) redirect("/onboarding/eta");
  if (!profile.is_admin) redirect("/profilo");

  // Conta quanti record sono ancora in chiaro (per dare un'anteprima all'admin)
  const admin = createAdminClient();
  const [{ data: messaggi }, { data: echi }] = await Promise.all([
    admin.from("messaggi").select("contenuto_testo").not("contenuto_testo", "is", null),
    admin.from("echi").select("testo"),
  ]);

  const messaggiInChiaro = (messaggi ?? []).filter(
    (m) => m.contenuto_testo && !isCiphertext(m.contenuto_testo)
  ).length;
  const messaggiTotali = messaggi?.length ?? 0;

  const echiInChiaro = (echi ?? []).filter(
    (e) => e.testo && !isCiphertext(e.testo)
  ).length;
  const echiTotali = echi?.length ?? 0;

  const tuttoCifrato = messaggiInChiaro === 0 && echiInChiaro === 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 px-6 py-12 pb-32">
        <div className="max-w-xl mx-auto">
          <header className="text-center mb-12">
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-accent mb-3">
              area amministrazione
            </p>
            <h1 className="font-serif text-4xl md:text-5xl font-medium leading-tight">
              Cifra storico messaggi.
            </h1>
            <p className="font-serif italic text-base text-ink-soft mt-3 leading-relaxed">
              Operazione una tantum: cifra tutti i messaggi e gli echi
              salvati prima dell&apos;attivazione della crittografia
              applicativa.
            </p>
          </header>

          <div className="border border-rule rounded-lg p-6 space-y-3 mb-8">
            <div className="flex justify-between font-sans text-sm">
              <span className="text-ink-faded uppercase tracking-widest text-xs">
                messaggi nel db
              </span>
              <span className="font-mono text-ink">
                {messaggiInChiaro} in chiaro / {messaggiTotali} totali
              </span>
            </div>
            <div className="flex justify-between font-sans text-sm">
              <span className="text-ink-faded uppercase tracking-widest text-xs">
                echi nel db
              </span>
              <span className="font-mono text-ink">
                {echiInChiaro} in chiaro / {echiTotali} totali
              </span>
            </div>
          </div>

          {tuttoCifrato ? (
            <div className="text-center py-8 px-6 border border-rule rounded-lg bg-paper-deep">
              <p className="font-serif italic text-lg text-ink-soft leading-relaxed">
                Tutto cifrato.
                <br />
                Niente più da fare qui.
              </p>
            </div>
          ) : (
            <>
              <p className="font-serif italic text-base text-ink-soft leading-relaxed mb-6">
                Premendo il bottone qui sotto, leggo riga per riga i record
                ancora in chiaro e li riscrivo cifrati con la chiave
                MESSAGES_ENCRYPTION_KEY. Operazione idempotente: se la rilanci
                quando tutto è già cifrato, non fa niente di nuovo.
                <br />
                <br />
                Su un dataset piccolo (qualche decina di record) il processo
                impiega pochi secondi. Su dataset grandi attendi che la
                pagina ricarichi senza richiamare nulla nel frattempo.
              </p>

              <CifraStoricoForm />
            </>
          )}

          <div className="mt-12 text-center">
            <Link
              href="/profilo"
              className="font-sans text-xs tracking-widest uppercase text-ink-faded hover:text-accent transition-colors"
            >
              ← torna al profilo
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

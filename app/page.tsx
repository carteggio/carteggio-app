import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import InstallPwaButton from "@/app/components/install-pwa-button";

export const dynamic = "force-dynamic";

export default async function Home() {
  // Se sei già autenticata, vai dritta al feed (o all'onboarding se manca)
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Verifica se ha un profilo (onboarding completato)
    const { data: profile } = await supabase
      .from("users")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (profile) {
      redirect("/feed");
    } else {
      redirect("/onboarding/eta");
    }
  }

  // Porta d'ingresso PWA: mostrata a chi non è autenticato.
  // Il bottone primario "Installa" viene gestito client-side in base al browser.
  // Il link "entra" è secondario, per chi è già registrato e vuole solo accedere.
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-xl w-full text-center">
        <p className="font-sans text-xs tracking-[0.3em] uppercase text-ink-faded mb-6">
          in arrivo · brescia · bergamo
        </p>
        <h1 className="font-serif text-7xl md:text-8xl font-medium leading-none">
          Cartegg<span className="text-accent italic">i</span>o
        </h1>
        <p className="font-serif italic text-xl md:text-2xl text-ink-soft mt-6">
          conoscersi per le parole, non per la foto
        </p>
        <div className="w-16 h-px bg-rule mx-auto mt-12" />
        <p className="font-serif italic text-base text-ink-faded mt-12 leading-relaxed max-w-md mx-auto">
          Un posto dove ci si conosce per quello che si pensa,
          <br />
          prima che per come si appare.
        </p>

        <div className="mt-12 flex flex-col items-center gap-5">
          <InstallPwaButton />
          <Link
            href="/login"
            className="font-sans text-xs tracking-[0.3em] uppercase text-ink-soft hover:text-accent transition-colors"
          >
            entra
          </Link>
        </div>
      </div>
    </main>
  );
}

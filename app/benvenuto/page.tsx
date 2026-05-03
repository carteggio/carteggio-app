import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/profile";

export default async function BenvenutoPage() {
  const { user, profile } = await getCurrentProfile();

  if (!user) {
    redirect("/login");
  }

  if (!profile) {
    redirect("/onboarding/eta");
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-md w-full text-center">
        <p className="font-sans text-xs tracking-[0.3em] uppercase text-ink-faded mb-6">
          {profile.citta.toLowerCase()}
        </p>
        <h1 className="font-serif text-5xl md:text-6xl font-medium leading-none">
          Benvenuta, <span className="italic">{profile.nome_battesimo}</span>.
        </h1>
        <p className="font-serif italic text-xl text-ink-soft mt-6">
          Sei dentro Carteggio.
        </p>

        <div className="w-16 h-px bg-rule mx-auto my-12" />

        <p className="font-serif italic text-base text-ink-faded leading-relaxed">
          Il feed, l'eco, i pezzi degli altri arriveranno
          <br />
          nel prossimo pomeriggio di sviluppo.
          <br />
          Per oggi: il tuo profilo c'è, il tuo primo pezzo è pubblicato.
        </p>

        <form action="/auth/logout" method="POST" className="mt-12">
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

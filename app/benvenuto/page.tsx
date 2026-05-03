import { redirect } from "next/navigation";
import Link from "next/link";
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
          Eccoti qui, <span className="italic">{profile.nome_battesimo}</span>.
        </h1>
        <p className="font-serif italic text-xl text-ink-soft mt-6">
          Sei dentro Carteggio.
        </p>

        <div className="w-16 h-px bg-rule mx-auto my-12" />

        <div className="flex flex-col gap-3">
          <Link
            href="/profilo"
            className="inline-block font-sans text-sm tracking-[0.25em] uppercase text-accent border border-accent rounded-full px-8 py-3 hover:bg-accent hover:text-paper transition-colors"
          >
            il tuo profilo
          </Link>
          <Link
            href="/scrivi"
            className="inline-block font-sans text-sm tracking-[0.25em] uppercase text-ink-faded border border-rule rounded-full px-8 py-3 hover:border-accent hover:text-accent transition-colors"
          >
            scrivi un pezzo
          </Link>
        </div>

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

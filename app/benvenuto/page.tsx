import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function BenvenutoPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-md w-full text-center">
        <p className="font-sans text-xs tracking-[0.3em] uppercase text-ink-faded mb-6">
          autenticata
        </p>
        <h1 className="font-serif text-5xl md:text-6xl font-medium leading-none">
          Benvenuta.
        </h1>
        <p className="font-serif italic text-xl text-ink-soft mt-6">
          Sei dentro Carteggio col numero
        </p>
        <p className="font-mono text-base text-accent mt-2">{user.phone}</p>

        <div className="w-16 h-px bg-rule mx-auto my-12" />

        <p className="font-serif italic text-base text-ink-faded leading-relaxed">
          Il prossimo passo è l'onboarding: città, nome, primo pezzo.
          <br />
          Lo costruiremo nel prossimo pomeriggio.
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

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/profile";
import ScriviForm from "./scrivi-form";

export const dynamic = "force-dynamic";

export default async function ScriviPage() {
  const { user, profile } = await getCurrentProfile();
  if (!user) redirect("/login");
  if (!profile) redirect("/onboarding/eta");

  const supabase = createClient();
  const { count } = await supabase
    .from("pezzi")
    .select("id", { count: "exact", head: true })
    .eq("autore_id", user.id)
    .eq("stato", "visibile");

  const numeroPezzi = count ?? 0;

  if (numeroPezzi >= 5) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
        <div className="max-w-md w-full text-center">
          <h1 className="font-serif text-3xl font-medium leading-tight">
            Hai già cinque pezzi.
          </h1>
          <p className="font-serif italic text-lg text-ink-soft mt-4 leading-relaxed">
            Per scriverne uno nuovo, prima eliminane uno dal tuo profilo.
            <br />
            Cinque è il numero giusto: oltre, ti diluisci.
          </p>
          <Link
            href="/profilo"
            className="inline-block mt-12 font-sans text-sm tracking-[0.25em] uppercase text-accent border border-accent rounded-full px-8 py-3 hover:bg-accent hover:text-paper transition-colors"
          >
            torna al profilo
          </Link>
        </div>
      </main>
    );
  }

  return <ScriviForm pezziAttuali={numeroPezzi} />;
}

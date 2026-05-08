import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/profile";
import { PEZZO_LIMITE_GIORNALIERO } from "@/lib/pezzi";
import { contaPezziOggi } from "@/lib/pezzi-server";
import ScriviForm from "./scrivi-form";
import Nav from "@/app/components/nav";

export const dynamic = "force-dynamic";

export default async function ScriviPage() {
  const { user, profile } = await getCurrentProfile();
  if (!user) redirect("/login");
  if (!profile) redirect("/onboarding/eta");

  const pezziOggi = await contaPezziOggi(user.id);

  if (pezziOggi >= PEZZO_LIMITE_GIORNALIERO) {
    return (
      <div className="min-h-screen flex flex-col">
        <Nav active="scrivi" />
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 pb-32">
          <div className="max-w-md w-full text-center">
            <h1 className="font-serif text-3xl font-medium leading-tight">
              Hai scritto cinque pezzi oggi.
            </h1>
            <p className="font-serif italic text-lg text-ink-soft mt-4 leading-relaxed">
              Cinque al giorno è la nostra misura.
              <br />
              Le parole hanno bisogno di riposare.
              <br />
              Domani potrai scriverne altre.
            </p>
            <Link
              href="/profilo"
              className="inline-block mt-12 font-sans text-sm tracking-[0.25em] uppercase text-accent border border-accent rounded-full px-8 py-3 hover:bg-accent hover:text-paper transition-colors"
            >
              torna al profilo
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Nav active="scrivi" />
      <div className="pb-32">
        <ScriviForm pezziOggi={pezziOggi} />
      </div>
    </div>
  );
}

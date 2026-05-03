import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/profile";
import Nav from "@/app/components/nav";
import FotoForm from "./foto-form";

export const dynamic = "force-dynamic";

export default async function FotoPage() {
  const { user, profile } = await getCurrentProfile();
  if (!user) redirect("/login");
  if (!profile) redirect("/onboarding/eta");

  return (
    <div className="min-h-screen flex flex-col">
      <Nav active="profilo" />
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
              foto profilo · facoltativa
            </p>
            <h1 className="font-serif text-4xl md:text-5xl font-medium leading-tight">
              La tua foto.
            </h1>
            <p className="font-serif italic text-base text-ink-soft mt-4 leading-relaxed">
              Se la carichi, resterà nascosta agli altri.
              <br />
              Si sblocca solo dentro un carteggio,
              <br />
              quando entrambi lo decidete dopo cinque messaggi.
              <br />
              <span className="text-accent">Non è obbligatoria.</span>
            </p>
          </header>

          <FotoForm fotoUrl={profile.foto_url} />
        </div>
      </main>
    </div>
  );
}

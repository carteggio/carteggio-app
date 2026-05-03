import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/profile";
import Nav from "@/app/components/nav";

export default async function EcoInviatoPage() {
  const { user, profile } = await getCurrentProfile();
  if (!user) redirect("/login");
  if (!profile) redirect("/onboarding/eta");

  return (
    <div className="min-h-screen flex flex-col">
      <Nav active="feed" />
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="max-w-md w-full text-center">
          <p className="font-sans text-xs tracking-[0.3em] uppercase text-ink-faded mb-6">
            eco partito
          </p>
          <h1 className="font-serif text-4xl md:text-5xl font-medium leading-tight">
            È andato.
          </h1>
          <p className="font-serif italic text-lg text-ink-soft mt-6 leading-relaxed">
            Adesso aspetta. Se ti risponderà,
            <br />
            si aprirà un carteggio.
          </p>

          <div className="w-16 h-px bg-rule mx-auto my-12" />

          <Link
            href="/feed"
            className="inline-block font-sans text-sm tracking-[0.25em] uppercase text-accent border border-accent rounded-full px-8 py-3 hover:bg-accent hover:text-paper transition-colors"
          >
            torna al feed
          </Link>
        </div>
      </main>
    </div>
  );
}

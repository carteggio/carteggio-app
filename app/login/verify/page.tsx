import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { verifyOtp } from "../actions";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: { phone?: string; error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/benvenuto");
  }

  if (!searchParams.phone) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-sm w-full">
        <div className="text-center mb-12">
          <Link href="/" className="font-serif text-4xl font-medium hover:no-underline">
            Cartegg<span className="text-accent italic">i</span>o
          </Link>
          <p className="font-serif italic text-ink-soft mt-2">
            inserisci il codice ricevuto via SMS
          </p>
          <p className="font-sans text-xs tracking-widest uppercase text-ink-faded mt-3">
            inviato a {searchParams.phone}
          </p>
        </div>

        <form action={verifyOtp} className="space-y-4">
          <input type="hidden" name="phone" value={searchParams.phone} />

          <div>
            <label
              htmlFor="token"
              className="block font-sans text-xs tracking-widest uppercase text-ink-faded font-semibold mb-2"
            >
              codice di sei cifre
            </label>
            <input
              id="token"
              name="token"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              required
              autoComplete="one-time-code"
              placeholder="123456"
              className="w-full bg-paper-deep border border-rule rounded-lg px-4 py-3 text-ink font-sans text-2xl text-center tracking-widest focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {searchParams.error && (
            <p className="font-serif italic text-sm text-accent">{searchParams.error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-ink text-paper rounded-lg py-3 font-sans text-sm tracking-widest uppercase font-medium hover:bg-accent transition-colors"
          >
            verifica
          </button>
        </form>

        <div className="text-center mt-8">
          <Link
            href="/login"
            className="font-serif italic text-sm text-ink-faded hover:text-accent"
          >
            ← cambio numero
          </Link>
        </div>
      </div>
    </main>
  );
}

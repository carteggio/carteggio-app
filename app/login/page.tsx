import { redirect } from "next/navigation";
import Script from "next/script";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getTurnstileSiteKey } from "@/lib/turnstile";
import { sendOtp } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/benvenuto");
  }

  const turnstileSiteKey = getTurnstileSiteKey();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      {turnstileSiteKey && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="afterInteractive"
          async
          defer
        />
      )}
      <div className="max-w-sm w-full">
        <div className="text-center mb-12">
          <Link href="/" className="font-serif text-4xl font-medium hover:no-underline">
            Cartegg<span className="text-accent italic">i</span>o
          </Link>
          <p className="font-serif italic text-ink-soft mt-2">entra con il tuo numero</p>
        </div>

        <form action={sendOtp} className="space-y-4">
          <div>
            <label
              htmlFor="phone"
              className="block font-sans text-xs tracking-widest uppercase text-ink-faded font-semibold mb-2"
            >
              numero di telefono
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              defaultValue="+39"
              required
              autoComplete="tel"
              placeholder="+39 333 1234567"
              className="w-full bg-paper-deep border border-rule rounded-lg px-4 py-3 text-ink font-sans focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {turnstileSiteKey && (
            <div
              className="cf-turnstile flex justify-center"
              data-sitekey={turnstileSiteKey}
              data-theme="light"
              data-size="flexible"
            />
          )}

          {searchParams.error && (
            <p className="font-serif italic text-sm text-accent">{searchParams.error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-ink text-paper rounded-lg py-3 font-sans text-sm tracking-widest uppercase font-medium hover:bg-accent transition-colors"
          >
            invia codice
          </button>
        </form>

        <p className="font-serif italic text-xs text-ink-faded text-center mt-8 leading-relaxed">
          Riceverai un SMS con un codice di sei cifre.
          <br />
          Niente password, niente social login.
        </p>
      </div>
    </main>
  );
}

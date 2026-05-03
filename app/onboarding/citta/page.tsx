import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/profile";
import { saveCitta } from "../actions";

function ProgressDots({ current }: { current: 1 | 2 | 3 | 4 }) {
  return (
    <div className="flex justify-center gap-2 mb-12">
      {[1, 2, 3, 4].map((step) => (
        <span
          key={step}
          className={`block w-2 h-2 rounded-full ${
            step === current
              ? "bg-accent"
              : step < current
                ? "bg-accent/40"
                : "bg-rule"
          }`}
        />
      ))}
    </div>
  );
}

export default async function OnboardingCitta({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const { user, profile } = await getCurrentProfile();
  if (!user) redirect("/login");
  if (profile) redirect("/benvenuto");

  // Verifica step precedente
  if (!user.user_metadata?.onboarding_eta_confermata) {
    redirect("/onboarding/eta");
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-md w-full">
        <ProgressDots current={2} />

        <h1 className="font-serif text-3xl md:text-4xl font-medium text-center leading-tight">
          Da dove ci scrivi?
        </h1>
        <p className="font-serif italic text-lg text-ink-soft text-center mt-4 leading-relaxed">
          In v1, Carteggio è aperto solo a Brescia e Bergamo.
        </p>

        <form action={saveCitta} className="mt-12 space-y-3">
          {(["Brescia", "Bergamo"] as const).map((c) => (
            <label
              key={c}
              className="flex items-center gap-4 cursor-pointer p-4 border border-rule rounded-lg hover:border-accent transition-colors has-[:checked]:border-accent has-[:checked]:bg-paper-deep"
            >
              <input
                type="radio"
                name="citta"
                value={c}
                required
                className="w-4 h-4 accent-[#7a2e2a]"
              />
              <span className="font-serif text-xl text-ink">{c}</span>
            </label>
          ))}

          {searchParams.error && (
            <p className="font-serif italic text-sm text-accent text-center pt-2">
              {searchParams.error}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-ink text-paper rounded-lg py-3 font-sans text-sm tracking-widest uppercase font-medium hover:bg-accent transition-colors mt-6"
          >
            continua
          </button>
        </form>
      </div>
    </main>
  );
}

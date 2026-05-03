import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/profile";
import { savePezzo } from "../actions";

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

export default async function OnboardingPezzo({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const { user, profile } = await getCurrentProfile();
  if (!user) redirect("/login");
  if (profile) redirect("/benvenuto");

  if (!user.user_metadata?.onboarding_eta_confermata) {
    redirect("/onboarding/eta");
  }
  if (!user.user_metadata?.onboarding_citta) {
    redirect("/onboarding/citta");
  }
  if (
    !user.user_metadata?.onboarding_nome ||
    !user.user_metadata?.onboarding_fascia
  ) {
    redirect("/onboarding/nome");
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-md w-full">
        <ProgressDots current={4} />

        <h1 className="font-serif text-3xl md:text-4xl font-medium text-center leading-tight">
          Il tuo primo pezzo.
        </h1>
        <p className="font-serif italic text-lg text-ink-soft text-center mt-4 leading-relaxed">
          Una sei parole che ti raccontano oggi.
          <br />
          Anche stupide. Anche tristi. Vere.
        </p>

        <form action={savePezzo} className="mt-12 space-y-6">
          <div>
            <label
              htmlFor="contenuto"
              className="block font-sans text-xs tracking-widest uppercase text-ink-faded font-semibold mb-2"
            >
              esattamente sei parole
            </label>
            <textarea
              id="contenuto"
              name="contenuto"
              required
              rows={3}
              maxLength={80}
              placeholder="Volevo restare. Nessuno me l'ha chiesto."
              className="w-full bg-paper-deep border border-rule rounded-lg px-4 py-3 text-ink font-serif text-xl text-center focus:outline-none focus:border-accent transition-colors resize-none"
            />
            <p className="font-serif italic text-xs text-ink-faded mt-2 text-center">
              il sistema controlla che siano esattamente sei parole.
            </p>
          </div>

          {searchParams.error && (
            <p className="font-serif italic text-sm text-accent text-center">
              {searchParams.error}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-ink text-paper rounded-lg py-3 font-sans text-sm tracking-widest uppercase font-medium hover:bg-accent transition-colors"
          >
            pubblica e completa
          </button>
        </form>
      </div>
    </main>
  );
}

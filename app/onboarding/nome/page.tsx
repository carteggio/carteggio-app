import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/profile";
import { saveNomeFascia } from "../actions";

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

const FASCE = ["18-24", "25-30", "30-35", "35-40", "40+"] as const;

export default async function OnboardingNome({
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

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-md w-full">
        <ProgressDots current={3} />

        <h1 className="font-serif text-3xl md:text-4xl font-medium text-center leading-tight">
          Come ti chiamano?
        </h1>
        <p className="font-serif italic text-lg text-ink-soft text-center mt-4 leading-relaxed">
          Solo nome di battesimo. Vero o inventato — basta che tu te lo senta.
        </p>

        <form action={saveNomeFascia} className="mt-12 space-y-6">
          <div>
            <label
              htmlFor="nome_battesimo"
              className="block font-sans text-xs tracking-widest uppercase text-ink-faded font-semibold mb-2"
            >
              il tuo nome
            </label>
            <input
              id="nome_battesimo"
              name="nome_battesimo"
              type="text"
              required
              maxLength={30}
              autoComplete="given-name"
              placeholder="Alice"
              className="w-full bg-paper-deep border border-rule rounded-lg px-4 py-3 text-ink font-serif text-xl focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div>
            <span className="block font-sans text-xs tracking-widest uppercase text-ink-faded font-semibold mb-3">
              quanti anni hai? <span className="lowercase tracking-normal italic font-serif text-ink-faded font-normal">(mostriamo solo la fascia)</span>
            </span>
            <div className="grid grid-cols-3 gap-2">
              {FASCE.map((f) => (
                <label
                  key={f}
                  className="cursor-pointer text-center p-3 border border-rule rounded-lg hover:border-accent transition-colors has-[:checked]:border-accent has-[:checked]:bg-paper-deep"
                >
                  <input
                    type="radio"
                    name="fascia_eta"
                    value={f}
                    required
                    className="hidden"
                  />
                  <span className="font-serif text-lg text-ink">{f}</span>
                </label>
              ))}
            </div>
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
            continua
          </button>
        </form>
      </div>
    </main>
  );
}

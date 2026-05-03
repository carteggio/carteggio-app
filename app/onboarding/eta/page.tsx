import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/profile";
import { saveEta } from "../actions";

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

export default async function OnboardingEta({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const { user, profile } = await getCurrentProfile();
  if (!user) redirect("/login");
  if (profile) redirect("/benvenuto");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-md w-full">
        <ProgressDots current={1} />

        <h1 className="font-serif text-3xl md:text-4xl font-medium text-center leading-tight">
          Prima cosa importante.
        </h1>
        <p className="font-serif italic text-lg text-ink-soft text-center mt-4 leading-relaxed">
          Carteggio è solo per maggiorenni.
        </p>

        <form action={saveEta} className="mt-12 space-y-6">
          <label className="flex items-start gap-3 cursor-pointer p-4 border border-rule rounded-lg hover:border-accent transition-colors">
            <input
              type="checkbox"
              name="conferma_eta"
              value="si"
              required
              className="mt-1 w-4 h-4 accent-[#7a2e2a]"
            />
            <span className="font-serif text-base text-ink leading-relaxed">
              Confermo di avere almeno 18 anni.
            </span>
          </label>

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

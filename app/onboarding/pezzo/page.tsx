import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/profile";
import OnboardingPezzoForm from "./onboarding-pezzo-form";

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
          Scegli un formato che ti somiglia,
          <br />
          poi scrivi qualcosa di vero.
        </p>

        <OnboardingPezzoForm initialError={searchParams.error} />
      </div>
    </main>
  );
}

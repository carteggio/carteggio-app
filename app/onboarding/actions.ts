"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FASCE_ETA } from "@/lib/utenti";
import { findFormato, countWords, type FormatoPezzo } from "@/lib/formati";

const FASCE_VALIDE = FASCE_ETA;
const CITTA_VALIDE = ["Brescia", "Bergamo"] as const;

// Formati ammessi per il primo pezzo dell'onboarding: i 5 formati pubblici
// (niente "voce", che è disponibile solo nei carteggi dopo la slow phase).
const FORMATI_VALIDI: FormatoPezzo[] = [
  "sei-parole",
  "ricordo",
  "confessione",
  "luogo",
  "piccola-felicita",
];

// Step 1: età 18+
export async function saveEta(formData: FormData) {
  const conferma = formData.get("conferma_eta");
  if (conferma !== "si") {
    redirect(
      "/onboarding/eta?error=" +
        encodeURIComponent("Devi avere almeno 18 anni per usare Carteggio.")
    );
  }

  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({
    data: { onboarding_eta_confermata: true },
  });

  if (error) {
    redirect("/onboarding/eta?error=" + encodeURIComponent(error.message));
  }

  redirect("/onboarding/citta");
}

// Step 2: città
export async function saveCitta(formData: FormData) {
  const citta = formData.get("citta");
  if (
    typeof citta !== "string" ||
    !CITTA_VALIDE.includes(citta as (typeof CITTA_VALIDE)[number])
  ) {
    redirect(
      "/onboarding/citta?error=" +
        encodeURIComponent("Scegli Brescia o Bergamo.")
    );
  }

  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({
    data: { onboarding_citta: citta },
  });

  if (error) {
    redirect("/onboarding/citta?error=" + encodeURIComponent(error.message));
  }

  redirect("/onboarding/nome");
}

// Step 3: nome + fascia età
export async function saveNomeFascia(formData: FormData) {
  const nome = formData.get("nome_battesimo");
  const fascia = formData.get("fascia_eta");

  if (typeof nome !== "string" || nome.trim().length < 1 || nome.trim().length > 30) {
    redirect(
      "/onboarding/nome?error=" +
        encodeURIComponent("Inserisci un nome (1-30 caratteri).")
    );
  }
  if (
    typeof fascia !== "string" ||
    !FASCE_VALIDE.includes(fascia as (typeof FASCE_VALIDE)[number])
  ) {
    redirect(
      "/onboarding/nome?error=" + encodeURIComponent("Scegli una fascia d'età.")
    );
  }

  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({
    data: {
      onboarding_nome: (nome as string).trim(),
      onboarding_fascia: fascia,
    },
  });

  if (error) {
    redirect("/onboarding/nome?error=" + encodeURIComponent(error.message));
  }

  redirect("/onboarding/pezzo");
}

// Step 4: primo pezzo (e creazione del profilo + del primo pezzo)
// Adesso accetta tutti e 5 i formati pubblici (sei-parole, ricordo,
// confessione, luogo, piccola-felicita). Validazione lato server come
// difesa, oltre a quella client-side in onboarding-pezzo-form.
export async function savePezzo(formData: FormData) {
  const formato = formData.get("formato");
  const contenuto = formData.get("contenuto");

  if (
    typeof formato !== "string" ||
    !FORMATI_VALIDI.includes(formato as (typeof FORMATI_VALIDI)[number])
  ) {
    redirect(
      "/onboarding/pezzo?error=" +
        encodeURIComponent("Scegli uno dei formati disponibili.")
    );
  }
  if (typeof contenuto !== "string" || contenuto.trim().length === 0) {
    redirect(
      "/onboarding/pezzo?error=" + encodeURIComponent("Scrivi qualcosa.")
    );
  }

  const fmt = findFormato(formato as string);
  if (!fmt) {
    redirect(
      "/onboarding/pezzo?error=" + encodeURIComponent("Formato non valido.")
    );
  }

  const trimmed = (contenuto as string).trim();

  // Validazione per formato: exactWords per 'sei-parole', maxChars per gli altri.
  if (fmt.exactWords) {
    const words = countWords(trimmed);
    if (words !== fmt.exactWords) {
      redirect(
        "/onboarding/pezzo?error=" +
          encodeURIComponent(
            `Una "${fmt.label.toLowerCase()}" è esattamente ${fmt.exactWords} parole. Ne hai scritte ${words}.`
          )
      );
    }
  } else if (trimmed.length > fmt.maxChars) {
    redirect(
      "/onboarding/pezzo?error=" +
        encodeURIComponent(
          `Hai superato il limite di ${fmt.maxChars} caratteri (sei a ${trimmed.length}).`
        )
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const meta = user.user_metadata ?? {};
  const nome = meta.onboarding_nome;
  const fascia = meta.onboarding_fascia;
  const citta = meta.onboarding_citta;

  if (!nome || !fascia || !citta || !meta.onboarding_eta_confermata) {
    redirect(
      "/onboarding/eta?error=" +
        encodeURIComponent("Completa l'onboarding dall'inizio.")
    );
  }

  // Crea il profilo
  const { error: profileError } = await supabase.from("users").insert({
    id: user.id,
    nome_battesimo: nome,
    fascia_eta: fascia,
    citta: citta,
  });

  if (profileError) {
    redirect(
      "/onboarding/pezzo?error=" + encodeURIComponent(profileError.message)
    );
  }

  // Crea il primo pezzo nel formato scelto
  const { error: pezzoError } = await supabase.from("pezzi").insert({
    autore_id: user.id,
    formato: formato as FormatoPezzo,
    contenuto_testo: trimmed,
  });

  if (pezzoError) {
    redirect(
      "/onboarding/pezzo?error=" +
        encodeURIComponent(
          "Profilo creato ma non sono riuscito a salvare il pezzo: " +
            pezzoError.message
        )
    );
  }

  redirect("/benvenuto");
}

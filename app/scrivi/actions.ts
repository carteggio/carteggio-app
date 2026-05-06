"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { findFormato, countWords, type FormatoPezzo } from "@/lib/formati";
import { checkContent } from "@/lib/moderazione";
import { checkRateLimit, LIMITS } from "@/lib/rate-limit";

type State = { error: string | null };

const FORMATI_VALIDI: FormatoPezzo[] = [
  "sei-parole",
  "ricordo",
  "confessione",
  "luogo",
  "piccola-felicita",
];

export async function savePezzo(
  _prevState: State,
  formData: FormData
): Promise<State> {
  const formato = formData.get("formato");
  const contenuto = formData.get("contenuto");

  if (typeof formato !== "string" || !FORMATI_VALIDI.includes(formato as FormatoPezzo)) {
    return { error: "Scegli uno dei formati disponibili." };
  }
  if (typeof contenuto !== "string" || contenuto.trim().length === 0) {
    return { error: "Scrivi qualcosa." };
  }

  const fmt = findFormato(formato);
  if (!fmt) {
    return { error: "Formato non valido." };
  }

  const trimmed = contenuto.trim();

  if (fmt.exactWords) {
    const words = countWords(trimmed);
    if (words !== fmt.exactWords) {
      return {
        error: `Una "${fmt.label.toLowerCase()}" è esattamente ${fmt.exactWords} parole. Ne hai scritte ${words}.`,
      };
    }
  } else if (trimmed.length > fmt.maxChars) {
    return {
      error: `Hai superato il limite di ${fmt.maxChars} caratteri (sei a ${trimmed.length}).`,
    };
  }

  // Filtro moderazione
  const mod = checkContent(trimmed);
  if (!mod.ok) {
    return { error: mod.reason };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Rate limit anti spam: max 5 pezzi/ora per utente.
  const rl = await checkRateLimit(
    "save-pezzo",
    user.id,
    LIMITS.savePezzo.limit,
    LIMITS.savePezzo.windowSeconds
  );
  if (!rl.ok) {
    const minuti = Math.ceil((rl.retryAfterSeconds ?? 3600) / 60);
    return {
      error: `Stai pubblicando troppo in fretta. Riprova tra circa ${minuti} minuti.`,
    };
  }

  const { count } = await supabase
    .from("pezzi")
    .select("id", { count: "exact", head: true })
    .eq("autore_id", user.id)
    .eq("stato", "visibile");

  if ((count ?? 0) >= 5) {
    return {
      error:
        "Hai già 5 pezzi attivi. Eliminane uno dal profilo prima di scriverne un altro.",
    };
  }

  const { error: insertError } = await supabase.from("pezzi").insert({
    autore_id: user.id,
    formato: formato as FormatoPezzo,
    contenuto_testo: trimmed,
  });

  if (insertError) {
    if (insertError.message.includes("row-level security")) {
      return {
        error: "Il tuo account non è attivo. Riprova più tardi o contatta il supporto.",
      };
    }
    return { error: insertError.message };
  }

  redirect("/profilo");
}

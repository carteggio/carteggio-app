"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type State = { error: string | null };

const CATEGORIE_VALIDE = [
  "inappropriato",
  "aggressivo",
  "bot_scam",
  "foto_non_consensuali",
  "altro",
] as const;

const TIPI_VALIDI = ["pezzo", "eco", "utente", "messaggio"] as const;

export async function saveSegnalazione(
  _prev: State,
  formData: FormData
): Promise<State> {
  const tipo = formData.get("tipo");
  const targetId = formData.get("targetId");
  const categoria = formData.get("categoria");
  const motivazione = formData.get("motivazione");

  if (
    typeof tipo !== "string" ||
    !TIPI_VALIDI.includes(tipo as (typeof TIPI_VALIDI)[number])
  ) {
    return { error: "Tipo non valido." };
  }
  if (typeof targetId !== "string" || targetId.length < 1) {
    return { error: "Target non valido." };
  }
  if (
    typeof categoria !== "string" ||
    !CATEGORIE_VALIDE.includes(categoria as (typeof CATEGORIE_VALIDE)[number])
  ) {
    return { error: "Scegli una categoria." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const motivazioneStr =
    typeof motivazione === "string" ? motivazione.trim() : "";

  const { error } = await supabase.from("segnalazioni").insert({
    segnalante_id: user.id,
    target_tipo: tipo,
    target_id: targetId,
    categoria,
    motivazione: motivazioneStr.length > 0 ? motivazioneStr : null,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/segnala/inviata");
}

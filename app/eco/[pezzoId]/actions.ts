"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  contaEchiOggi,
  ECO_LIMITE_GIORNALIERO,
  ECO_TESTO_MIN,
  ECO_TESTO_MAX,
} from "@/lib/eco";

type State = { error: string | null };

export async function saveEco(
  _prev: State,
  formData: FormData
): Promise<State> {
  const pezzoId = formData.get("pezzoId");
  const testo = formData.get("testo");

  if (typeof pezzoId !== "string" || pezzoId.length < 1) {
    return { error: "Pezzo non valido." };
  }
  if (typeof testo !== "string") {
    return { error: "Scrivi un eco." };
  }

  const trimmed = testo.trim();
  if (trimmed.length < ECO_TESTO_MIN) {
    return {
      error: `L'eco deve essere lungo almeno ${ECO_TESTO_MIN} caratteri.`,
    };
  }
  if (trimmed.length > ECO_TESTO_MAX) {
    return {
      error: `L'eco non può superare i ${ECO_TESTO_MAX} caratteri.`,
    };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verifica che il pezzo esista e non sia mio
  const { data: pezzo } = await supabase
    .from("pezzi")
    .select("id, autore_id, stato")
    .eq("id", pezzoId)
    .maybeSingle();

  if (!pezzo) return { error: "Pezzo non trovato." };
  if (pezzo.stato !== "visibile") return { error: "Pezzo non disponibile." };
  if (pezzo.autore_id === user.id) {
    return { error: "Non puoi lasciare un eco a un tuo pezzo." };
  }

  // Verifica eco doppio
  const { data: esistente } = await supabase
    .from("echi")
    .select("id")
    .eq("mittente_id", user.id)
    .eq("pezzo_id", pezzoId)
    .maybeSingle();

  if (esistente) {
    return { error: "Hai già lasciato un eco a questo pezzo." };
  }

  // Verifica limite quotidiano
  const oggi = await contaEchiOggi(user.id);
  if (oggi >= ECO_LIMITE_GIORNALIERO) {
    return {
      error: `Hai già lasciato ${ECO_LIMITE_GIORNALIERO} echi oggi. Torna domani.`,
    };
  }

  const { error: insertError } = await supabase.from("echi").insert({
    mittente_id: user.id,
    pezzo_id: pezzoId,
    testo: trimmed,
  });

  if (insertError) {
    return { error: insertError.message };
  }

  redirect("/eco/inviato");
}

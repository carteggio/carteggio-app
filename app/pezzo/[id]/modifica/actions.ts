"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { findFormato, countWords, type FormatoPezzo } from "@/lib/formati";
import { checkContent } from "@/lib/moderazione";

type State = { error: string | null };

export async function aggiornaPezzo(
  _prev: State,
  formData: FormData
): Promise<State> {
  const pezzoId = formData.get("pezzoId");
  const contenuto = formData.get("contenuto");

  if (typeof pezzoId !== "string" || pezzoId.length < 1) {
    return { error: "Pezzo non valido." };
  }
  if (typeof contenuto !== "string" || contenuto.trim().length === 0) {
    return { error: "Scrivi qualcosa." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Carica il pezzo per verificare proprietà e formato
  const { data: pezzo } = await supabase
    .from("pezzi")
    .select("id, autore_id, formato, stato")
    .eq("id", pezzoId)
    .maybeSingle();

  if (!pezzo) return { error: "Pezzo non trovato." };
  if (pezzo.autore_id !== user.id) return { error: "Non sei l'autore di questo pezzo." };
  if (pezzo.stato !== "visibile") return { error: "Questo pezzo non è più modificabile." };

  const fmt = findFormato(pezzo.formato);
  if (!fmt) return { error: "Formato non riconosciuto." };

  const trimmed = contenuto.trim();

  // Validazione formato
  if (fmt.exactWords) {
    const words = countWords(trimmed);
    if (words !== fmt.exactWords) {
      return {
        error: `Una "${fmt.label.toLowerCase()}" è esattamente ${fmt.exactWords} parole. Ne hai scritte ${words}.`,
      };
    }
  } else if (trimmed.length > fmt.maxChars) {
    return {
      error: `Hai superato il limite di ${fmt.maxChars} caratteri.`,
    };
  }

  // Moderazione
  const mod = checkContent(trimmed);
  if (!mod.ok) {
    return { error: mod.reason };
  }

  const { error: updateError } = await supabase
    .from("pezzi")
    .update({ contenuto_testo: trimmed })
    .eq("id", pezzoId)
    .eq("autore_id", user.id);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath("/profilo");
  revalidatePath("/feed");
  redirect("/profilo");
}

export async function eliminaPezzo(formData: FormData) {
  const pezzoId = formData.get("pezzoId");
  if (typeof pezzoId !== "string") return;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Soft delete: cambio stato a 'nascosto' invece di cancellare
  // così echi e carteggi associati restano integri.
  await supabase
    .from("pezzi")
    .update({ stato: "nascosto" })
    .eq("id", pezzoId)
    .eq("autore_id", user.id);

  revalidatePath("/profilo");
  revalidatePath("/feed");
  redirect("/profilo");
}

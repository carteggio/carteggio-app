"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { canSendMessage } from "@/lib/carteggio-server";

type State = { error: string | null };

export async function sendMessaggio(
  _prev: State,
  formData: FormData
): Promise<State> {
  const carteggioId = formData.get("carteggioId");
  const messaggio = formData.get("messaggio");

  if (typeof carteggioId !== "string" || carteggioId.length < 1) {
    return { error: "Carteggio non valido." };
  }
  if (typeof messaggio !== "string") {
    return { error: "Scrivi qualcosa." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verifica che l'utente sia partecipante
  const { data: carteggio } = await supabase
    .from("carteggi")
    .select("id, partecipante_a_id, partecipante_b_id, stato")
    .eq("id", carteggioId)
    .maybeSingle();

  if (!carteggio) return { error: "Carteggio non trovato." };
  if (carteggio.stato !== "attivo")
    return { error: "Carteggio archiviato o chiuso." };
  if (
    carteggio.partecipante_a_id !== user.id &&
    carteggio.partecipante_b_id !== user.id
  ) {
    return { error: "Non sei un partecipante di questo carteggio." };
  }

  // Carica messaggi
  const { data: messaggi } = await supabase
    .from("messaggi")
    .select("id, mittente_id, created_at")
    .eq("carteggio_id", carteggioId)
    .order("created_at", { ascending: true });

  const sendCheck = canSendMessage({
    messages: messaggi ?? [],
    currentUserId: user.id,
  });

  if (!sendCheck.canSend) {
    return { error: sendCheck.reason ?? "Non puoi scrivere ora." };
  }

  const trimmed = messaggio.trim();
  if (trimmed.length < sendCheck.minLength) {
    return {
      error: `Il messaggio deve essere almeno ${sendCheck.minLength} caratteri.`,
    };
  }
  if (trimmed.length > sendCheck.maxLength) {
    return {
      error: `Il messaggio non può superare i ${sendCheck.maxLength} caratteri.`,
    };
  }

  const { error: insertError } = await supabase.from("messaggi").insert({
    carteggio_id: carteggioId,
    mittente_id: user.id,
    tipo: "testo",
    contenuto_testo: trimmed,
  });

  if (insertError) {
    return { error: insertError.message };
  }

  // Update ultimo_messaggio_at
  await supabase
    .from("carteggi")
    .update({ ultimo_messaggio_at: new Date().toISOString() })
    .eq("id", carteggioId);

  revalidatePath(`/carteggi/${carteggioId}`);
  return { error: null };
}

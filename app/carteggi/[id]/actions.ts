"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { canSendMessage } from "@/lib/carteggio-server";
import { PHOTO_UNLOCK_AFTER_MESSAGES } from "@/lib/foto";
import { checkContent } from "@/lib/moderazione";

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

  const { data: carteggio } = await supabase
    .from("carteggi")
    .select(
      "id, partecipante_a_id, partecipante_b_id, stato, a:users!partecipante_a_id(nome_battesimo), b:users!partecipante_b_id(nome_battesimo)"
    )
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

  const { data: messaggi } = await supabase
    .from("messaggi")
    .select("id, mittente_id, created_at")
    .eq("carteggio_id", carteggioId)
    .order("created_at", { ascending: true });

  // Identifica nome dell'altro partecipante (per messaggi cooldown)
  const sonoA = carteggio.partecipante_a_id === user.id;
  const altroId = sonoA ? carteggio.partecipante_b_id : carteggio.partecipante_a_id;
  const a = carteggio.a as unknown as { nome_battesimo: string } | null;
  const b = carteggio.b as unknown as { nome_battesimo: string } | null;
  const altroNome = sonoA ? b?.nome_battesimo : a?.nome_battesimo;

  const sendCheck = canSendMessage({
    messages: messaggi ?? [],
    currentUserId: user.id,
    altroPartecipante: altroNome
      ? { id: altroId, nome: altroNome }
      : undefined,
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

  // Moderazione (solo nei primi 6 messaggi della slow phase, dove vogliamo
  // davvero impedire scambio di contatti. In free phase rilassiamo.)
  if (sendCheck.phase === "slow") {
    const mod = checkContent(trimmed);
    if (!mod.ok) {
      return { error: mod.reason };
    }
  }

  const { error: insertError } = await supabase.from("messaggi").insert({
    carteggio_id: carteggioId,
    mittente_id: user.id,
    tipo: "testo",
    contenuto_testo: trimmed,
  });

  if (insertError) {
    if (insertError.message.includes("row-level security")) {
      return { error: "Non puoi inviare messaggi adesso." };
    }
    return { error: insertError.message };
  }

  await supabase
    .from("carteggi")
    .update({ ultimo_messaggio_at: new Date().toISOString() })
    .eq("id", carteggioId);

  revalidatePath(`/carteggi/${carteggioId}`);
  return { error: null };
}

export async function sbloccaFoto(formData: FormData) {
  const carteggioId = formData.get("carteggioId");
  if (typeof carteggioId !== "string") return;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: carteggio } = await supabase
    .from("carteggi")
    .select(
      "id, partecipante_a_id, partecipante_b_id, stato, foto_sbloccata_a, foto_sbloccata_b"
    )
    .eq("id", carteggioId)
    .maybeSingle();

  if (!carteggio) return;
  if (carteggio.stato !== "attivo") return;

  const isA = carteggio.partecipante_a_id === user.id;
  const isB = carteggio.partecipante_b_id === user.id;
  if (!isA && !isB) return;

  const { count } = await supabase
    .from("messaggi")
    .select("id", { count: "exact", head: true })
    .eq("carteggio_id", carteggioId);

  if ((count ?? 0) < PHOTO_UNLOCK_AFTER_MESSAGES) return;

  const update = isA
    ? { foto_sbloccata_a: true }
    : { foto_sbloccata_b: true };

  await supabase.from("carteggi").update(update).eq("id", carteggioId);

  revalidatePath(`/carteggi/${carteggioId}`);
}

export async function bloccaUtente(formData: FormData) {
  const carteggioId = formData.get("carteggioId");
  if (typeof carteggioId !== "string") return;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: carteggio } = await supabase
    .from("carteggi")
    .select("id, partecipante_a_id, partecipante_b_id")
    .eq("id", carteggioId)
    .maybeSingle();

  if (!carteggio) return;

  const altroId =
    carteggio.partecipante_a_id === user.id
      ? carteggio.partecipante_b_id
      : carteggio.partecipante_a_id;

  if (altroId === user.id) return;

  // Inserisce blocco (se non esiste già)
  await supabase
    .from("blocchi")
    .insert({ blocker_id: user.id, blocked_id: altroId });

  // Archivia carteggi attivi tra i due
  await supabase
    .from("carteggi")
    .update({ stato: "archiviato" })
    .or(
      `and(partecipante_a_id.eq.${user.id},partecipante_b_id.eq.${altroId}),` +
        `and(partecipante_a_id.eq.${altroId},partecipante_b_id.eq.${user.id})`
    )
    .eq("stato", "attivo");

  redirect("/carteggi");
}

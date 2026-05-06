"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MESSAGGIO_MIN_SLOW, MESSAGGIO_MAX_SLOW } from "@/lib/carteggio";
import { checkContent } from "@/lib/moderazione";
import { inviaPushAUtente } from "@/lib/push-server";
import { getUnreadEchiCount } from "@/lib/unread-server";
import { checkRateLimit, LIMITS } from "@/lib/rate-limit";

type State = { error: string | null };

export async function apriCarteggio(
  _prev: State,
  formData: FormData
): Promise<State> {
  const ecoId = formData.get("ecoId");
  const messaggio = formData.get("messaggio");

  if (typeof ecoId !== "string" || ecoId.length < 1) {
    return { error: "Eco non valido." };
  }
  if (typeof messaggio !== "string") {
    return { error: "Scrivi qualcosa." };
  }

  const trimmed = messaggio.trim();
  if (trimmed.length < MESSAGGIO_MIN_SLOW) {
    return { error: `La prima lettera deve essere almeno ${MESSAGGIO_MIN_SLOW} caratteri.` };
  }
  if (trimmed.length > MESSAGGIO_MAX_SLOW) {
    return { error: `La lettera non può superare i ${MESSAGGIO_MAX_SLOW} caratteri.` };
  }

  const mod = checkContent(trimmed);
  if (!mod.ok) {
    return { error: mod.reason };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Rate limit: max 5 carteggi aperti/ora per utente.
  const rl = await checkRateLimit(
    "apri-carteggio",
    user.id,
    LIMITS.apriCarteggio.limit,
    LIMITS.apriCarteggio.windowSeconds
  );
  if (!rl.ok) {
    const minuti = Math.ceil((rl.retryAfterSeconds ?? 3600) / 60);
    return {
      error: `Stai aprendo troppi carteggi. Riprova tra circa ${minuti} minuti.`,
    };
  }

  const { data: eco } = await supabase
    .from("echi")
    .select("id, mittente_id, stato, pezzo:pezzi!pezzo_id(id, autore_id)")
    .eq("id", ecoId)
    .maybeSingle();

  if (!eco) return { error: "Eco non trovato." };

  const pezzo = eco.pezzo as unknown as { id: string; autore_id: string } | null;
  if (!pezzo) return { error: "Pezzo non trovato." };

  if (pezzo.autore_id !== user.id) {
    return { error: "Solo l'autore del pezzo può rispondere a questo eco." };
  }

  if (eco.stato !== "in_attesa") {
    return { error: "Questo eco è già stato gestito." };
  }

  const { data: existing } = await supabase
    .from("carteggi")
    .select("id")
    .eq("eco_origine_id", eco.id)
    .maybeSingle();

  if (existing) {
    redirect(`/carteggi/${existing.id}`);
  }

  const { data: carteggio, error: cErr } = await supabase
    .from("carteggi")
    .insert({
      partecipante_a_id: user.id,
      partecipante_b_id: eco.mittente_id,
      eco_origine_id: eco.id,
    })
    .select("id")
    .single();

  if (cErr || !carteggio) {
    return { error: cErr?.message ?? "Errore creando il carteggio." };
  }

  const { error: mErr } = await supabase.from("messaggi").insert({
    carteggio_id: carteggio.id,
    mittente_id: user.id,
    tipo: "testo",
    contenuto_testo: trimmed,
  });

  if (mErr) {
    return { error: mErr.message };
  }

  await supabase.from("echi").update({ stato: "risposto" }).eq("id", eco.id);

  await supabase
    .from("carteggi")
    .update({ ultimo_messaggio_at: new Date().toISOString() })
    .eq("id", carteggio.id);

  // Push al destinatario, con badge count
  const { data: ioNome } = await supabase
    .from("users")
    .select("nome_battesimo")
    .eq("id", user.id)
    .maybeSingle();

  const badgeCount = await getUnreadEchiCount(eco.mittente_id);

  inviaPushAUtente(eco.mittente_id, {
    title: "Hai una risposta",
    body: `${ioNome?.nome_battesimo ?? "Qualcuno"} ha aperto un carteggio con te.`,
    url: `/carteggi/${carteggio.id}`,
    tag: `carteggio-${carteggio.id}`,
    appBadge: badgeCount,
  }).catch((e) => console.error("push carteggio:", e));

  redirect(`/carteggi/${carteggio.id}`);
}

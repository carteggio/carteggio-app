import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Conta tutto ciò che "aspetta" l'utente sulla tab carteggi:
 *   - echi in attesa di risposta sui suoi pezzi (letto_at null)
 *   - messaggi nuovi sui carteggi aperti, mandati dall'altra persona (letto_at null)
 *
 * Questo è il numero che appare:
 *   - sul badge dell'icona PWA (via push)
 *   - sul counter rosso sopra l'icona busta nel bottom nav
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = createAdminClient();

  // ---- 1. Echi in attesa sui miei pezzi ----
  const { data: mieiPezzi } = await supabase
    .from("pezzi")
    .select("id")
    .eq("autore_id", userId)
    .eq("stato", "visibile");

  let echiNonLetti = 0;
  if (mieiPezzi && mieiPezzi.length > 0) {
    const pezzoIds = mieiPezzi.map((p) => p.id);
    const { count } = await supabase
      .from("echi")
      .select("id", { count: "exact", head: true })
      .in("pezzo_id", pezzoIds)
      .eq("stato", "in_attesa")
      .is("letto_at", null);
    echiNonLetti = count ?? 0;
  }

  // ---- 2. Messaggi non letti sui miei carteggi attivi ----
  // Faccio due query separate (partecipante_a + partecipante_b) e unisco gli id,
  // per evitare problemi con .or() in Supabase JS quando combinato con altri filtri.
  const [{ data: carteggiA }, { data: carteggiB }] = await Promise.all([
    supabase
      .from("carteggi")
      .select("id")
      .eq("partecipante_a_id", userId)
      .eq("stato", "attivo"),
    supabase
      .from("carteggi")
      .select("id")
      .eq("partecipante_b_id", userId)
      .eq("stato", "attivo"),
  ]);

  const carteggioIds = [
    ...(carteggiA ?? []).map((c) => c.id),
    ...(carteggiB ?? []).map((c) => c.id),
  ];

  let messaggiNonLetti = 0;
  if (carteggioIds.length > 0) {
    const { count } = await supabase
      .from("messaggi")
      .select("id", { count: "exact", head: true })
      .in("carteggio_id", carteggioIds)
      .neq("mittente_id", userId)
      .is("letto_at", null);
    messaggiNonLetti = count ?? 0;
  }

  return echiNonLetti + messaggiNonLetti;
}

/**
 * Alias retrocompatibile. Le pagine vecchie chiamano ancora
 * getUnreadEchiCount; lo manteniamo come wrapper sul nuovo conteggio.
 */
export const getUnreadEchiCount = getUnreadCount;

/**
 * Marca tutti gli echi pending (in_attesa, non ancora letti) come letti.
 * Va chiamato quando l'utente apre la pagina /carteggi (l'inbox).
 * Non cambia lo stato dell'eco (resta in_attesa); solo letto_at diventa now.
 */
export async function markEchiAsLetti(userId: string): Promise<void> {
  const supabase = createAdminClient();

  const { data: mieiPezzi } = await supabase
    .from("pezzi")
    .select("id")
    .eq("autore_id", userId);

  if (!mieiPezzi || mieiPezzi.length === 0) return;

  const pezzoIds = mieiPezzi.map((p) => p.id);

  await supabase
    .from("echi")
    .update({ letto_at: new Date().toISOString() })
    .in("pezzo_id", pezzoIds)
    .eq("stato", "in_attesa")
    .is("letto_at", null);
}

/**
 * Marca tutti i messaggi non letti di un singolo carteggio come letti.
 * Va chiamato quando l'utente apre /carteggi/[id]. Marca solo i messaggi
 * mandati dall'altra persona (i propri sono ovviamente già "letti").
 */
export async function markMessaggiAsLetti(
  userId: string,
  carteggioId: string
): Promise<void> {
  const supabase = createAdminClient();

  await supabase
    .from("messaggi")
    .update({ letto_at: new Date().toISOString() })
    .eq("carteggio_id", carteggioId)
    .neq("mittente_id", userId)
    .is("letto_at", null);
}

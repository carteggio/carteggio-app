import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Conta gli echi non ancora letti dall'utente (echi in stato "in_attesa"
 * sui suoi pezzi che non hanno letto_at).
 * Rappresenta il "qualcosa ti aspetta" sulla tab carteggi.
 */
export async function getUnreadEchiCount(userId: string): Promise<number> {
  const supabase = createAdminClient();

  const { data: mieiPezzi } = await supabase
    .from("pezzi")
    .select("id")
    .eq("autore_id", userId)
    .eq("stato", "visibile");

  if (!mieiPezzi || mieiPezzi.length === 0) return 0;

  const pezzoIds = mieiPezzi.map((p) => p.id);

  const { count } = await supabase
    .from("echi")
    .select("id", { count: "exact", head: true })
    .in("pezzo_id", pezzoIds)
    .eq("stato", "in_attesa")
    .is("letto_at", null);

  return count ?? 0;
}

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

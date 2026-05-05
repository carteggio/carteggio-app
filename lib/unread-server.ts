import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Conta gli echi in stato "in_attesa" su pezzi dell'utente.
 * Rappresenta il "ti sta aspettando una risposta" sulla tab carteggi.
 *
 * Usa l'admin client perché stiamo calcolando il count per l'utente
 * destinatario di una push, non per chi sta facendo la richiesta.
 */
export async function getUnreadEchiCount(userId: string): Promise<number> {
  const supabase = createAdminClient();

  // Prima i miei pezzi visibili
  const { data: mieiPezzi } = await supabase
    .from("pezzi")
    .select("id")
    .eq("autore_id", userId)
    .eq("stato", "visibile");

  if (!mieiPezzi || mieiPezzi.length === 0) return 0;

  const pezzoIds = mieiPezzi.map((p) => p.id);

  // Poi conta echi in attesa su quei pezzi
  const { count } = await supabase
    .from("echi")
    .select("id", { count: "exact", head: true })
    .in("pezzo_id", pezzoIds)
    .eq("stato", "in_attesa");

  return count ?? 0;
}

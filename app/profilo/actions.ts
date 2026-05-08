"use server";

import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 50;

export type PezzoMin = {
  id: string;
  formato: string;
  contenuto_testo: string | null;
  created_at: string;
};

/**
 * Carica un'altra pagina di pezzi del profilo dell'utente loggato, ordinati
 * per data discendente. Usata dal bottone "carica altri 50" sul profilo.
 *
 * Il client passa l'offset (numero di pezzi già visualizzati). Ritorna
 * massimo PAGE_SIZE elementi successivi + un flag hasMore per nascondere
 * il bottone quando non c'è più nulla da caricare.
 *
 * Se l'utente non è autenticato la action ritorna lista vuota: in quel
 * caso la pagina /profilo l'avrà già rediretto al login lato SSR.
 */
export async function loadMorePezzi(
  offset: number
): Promise<{ pezzi: PezzoMin[]; hasMore: boolean }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { pezzi: [], hasMore: false };

  const start = Math.max(0, Math.floor(offset));
  const end = start + PAGE_SIZE - 1;

  const { data, error } = await supabase
    .from("pezzi")
    .select("id, formato, contenuto_testo, created_at")
    .eq("autore_id", user.id)
    .eq("stato", "visibile")
    .order("created_at", { ascending: false })
    .range(start, end);

  if (error) {
    console.error("loadMorePezzi:", error);
    return { pezzi: [], hasMore: false };
  }

  const pezzi = (data ?? []) as PezzoMin[];
  return {
    pezzi,
    hasMore: pezzi.length === PAGE_SIZE,
  };
}

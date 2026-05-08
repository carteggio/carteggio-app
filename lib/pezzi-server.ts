import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * Conta i pezzi pubblicati dall'utente da mezzanotte a oggi.
 * Usato per applicare il limite quotidiano di pubblicazione (PEZZO_LIMITE_GIORNALIERO).
 *
 * Il countdown è basato sull'ora del server (Vercel fra1 = UTC). Per gli
 * utenti in CET/CEST il giorno si rinnova alle 02:00 ora italiana, che è
 * un compromesso accettabile (in pratica nessuno scrive a quell'ora).
 */
export async function contaPezziOggi(userId: string): Promise<number> {
  const supabase = createClient();
  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("pezzi")
    .select("id", { count: "exact", head: true })
    .eq("autore_id", userId)
    .gte("created_at", oggi.toISOString());

  return count ?? 0;
}

import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * Conta gli echi inviati dall'utente nelle ultime 24 ore (mezzanotte locale).
 * Usato per applicare il limite quotidiano.
 */
export async function contaEchiOggi(userId: string): Promise<number> {
  const supabase = createClient();
  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("echi")
    .select("id", { count: "exact", head: true })
    .eq("mittente_id", userId)
    .gte("created_at", oggi.toISOString());

  return count ?? 0;
}

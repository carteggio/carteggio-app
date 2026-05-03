import { createClient } from "@/lib/supabase/server";

export const ECO_LIMITE_GIORNALIERO = 3;
export const ECO_TESTO_MIN = 40;
export const ECO_TESTO_MAX = 200;

/**
 * Conta gli echi inviati dall'utente corrente nelle ultime 24 ore in fascia
 * Europa/Roma (mezzanotte locale).
 */
export async function contaEchiOggi(userId: string): Promise<number> {
  const supabase = createClient();
  // Calcoliamo la mezzanotte di oggi in fuso orario locale (semplice approx via JS).
  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("echi")
    .select("id", { count: "exact", head: true })
    .eq("mittente_id", userId)
    .gte("created_at", oggi.toISOString());

  return count ?? 0;
}

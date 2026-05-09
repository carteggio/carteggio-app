"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cifraMessaggio, isCiphertext } from "@/lib/crypto-messaggi";

export type CifraturaResult = {
  ok: boolean;
  messaggiCifrati: number;
  messaggiTotali: number;
  echiCifrati: number;
  echiTotali: number;
  error?: string;
};

/**
 * Migration script una tantum: cifra tutti i messaggi e gli echi presenti
 * nel DB che non sono ancora cifrati (cioè non iniziano con il prefisso
 * "enc:v1:"). Idempotente: rilanciarlo dopo che è completato non fa nulla
 * di nuovo.
 *
 * Solo admin (is_admin = true) può eseguirla. Usa il client service_role
 * per by-passare RLS (deve poter leggere e scrivere su tutto).
 */
export async function cifraStoricoMessaggi(): Promise<CifraturaResult> {
  // Verifica admin tramite il client utente-loggato (RLS-aware)
  const userClient = createClient();
  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await userClient
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    return {
      ok: false,
      messaggiCifrati: 0,
      messaggiTotali: 0,
      echiCifrati: 0,
      echiTotali: 0,
      error: "Solo admin possono eseguire questa migrazione.",
    };
  }

  // Per leggere TUTTI i messaggi/echi e riscriverli, usiamo service_role.
  const admin = createAdminClient();

  let messaggiCifrati = 0;
  let messaggiTotali = 0;
  let echiCifrati = 0;
  let echiTotali = 0;

  try {
    // Cifra messaggi
    const { data: messaggi } = await admin
      .from("messaggi")
      .select("id, contenuto_testo")
      .not("contenuto_testo", "is", null);

    messaggiTotali = messaggi?.length ?? 0;

    for (const m of messaggi ?? []) {
      if (m.contenuto_testo && !isCiphertext(m.contenuto_testo)) {
        const { error } = await admin
          .from("messaggi")
          .update({ contenuto_testo: cifraMessaggio(m.contenuto_testo) })
          .eq("id", m.id);
        if (!error) messaggiCifrati++;
      }
    }

    // Cifra echi
    const { data: echi } = await admin.from("echi").select("id, testo");

    echiTotali = echi?.length ?? 0;

    for (const e of echi ?? []) {
      if (e.testo && !isCiphertext(e.testo)) {
        const { error } = await admin
          .from("echi")
          .update({ testo: cifraMessaggio(e.testo) })
          .eq("id", e.id);
        if (!error) echiCifrati++;
      }
    }

    return {
      ok: true,
      messaggiCifrati,
      messaggiTotali,
      echiCifrati,
      echiTotali,
    };
  } catch (e) {
    return {
      ok: false,
      messaggiCifrati,
      messaggiTotali,
      echiCifrati,
      echiTotali,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

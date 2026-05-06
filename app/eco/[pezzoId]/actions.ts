"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  ECO_LIMITE_GIORNALIERO,
  ECO_TESTO_MIN,
  ECO_TESTO_MAX,
} from "@/lib/eco";
import { contaEchiOggi } from "@/lib/eco-server";
import { checkContent } from "@/lib/moderazione";
import { inviaPushAUtente } from "@/lib/push-server";
import { getUnreadEchiCount } from "@/lib/unread-server";
import { checkRateLimit, LIMITS } from "@/lib/rate-limit";

type State = { error: string | null };

export async function saveEco(
  _prev: State,
  formData: FormData
): Promise<State> {
  const pezzoId = formData.get("pezzoId");
  const testo = formData.get("testo");

  if (typeof pezzoId !== "string" || pezzoId.length < 1) {
    return { error: "Pezzo non valido." };
  }
  if (typeof testo !== "string") {
    return { error: "Scrivi un eco." };
  }

  const trimmed = testo.trim();
  if (trimmed.length < ECO_TESTO_MIN) {
    return { error: `L'eco deve essere lungo almeno ${ECO_TESTO_MIN} caratteri.` };
  }
  if (trimmed.length > ECO_TESTO_MAX) {
    return { error: `L'eco non può superare i ${ECO_TESTO_MAX} caratteri.` };
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

  // Rate limit anti spam: max 15 echi/ora (sopra il limite giornaliero esistente).
  const rl = await checkRateLimit(
    "save-eco",
    user.id,
    LIMITS.saveEco.limit,
    LIMITS.saveEco.windowSeconds
  );
  if (!rl.ok) {
    const minuti = Math.ceil((rl.retryAfterSeconds ?? 3600) / 60);
    return {
      error: `Stai inviando echi troppo in fretta. Riprova tra circa ${minuti} minuti.`,
    };
  }

  const { data: pezzo } = await supabase
    .from("pezzi")
    .select("id, autore_id, stato")
    .eq("id", pezzoId)
    .maybeSingle();

  if (!pezzo) return { error: "Pezzo non trovato o non più disponibile." };
  if (pezzo.stato !== "visibile") return { error: "Pezzo non disponibile." };
  if (pezzo.autore_id === user.id) {
    return { error: "Non puoi lasciare un eco a un tuo pezzo." };
  }

  const { data: esistente } = await supabase
    .from("echi")
    .select("id")
    .eq("mittente_id", user.id)
    .eq("pezzo_id", pezzoId)
    .maybeSingle();

  if (esistente) {
    return { error: "Hai già lasciato un eco a questo pezzo." };
  }

  const oggi = await contaEchiOggi(user.id);
  if (oggi >= ECO_LIMITE_GIORNALIERO) {
    return { error: `Hai già lasciato ${ECO_LIMITE_GIORNALIERO} echi oggi. Torna domani.` };
  }

  const { error: insertError } = await supabase.from("echi").insert({
    mittente_id: user.id,
    pezzo_id: pezzoId,
    testo: trimmed,
  });

  if (insertError) {
    if (insertError.message.includes("row-level security")) {
      return { error: "Non puoi inviare echi adesso." };
    }
    return { error: insertError.message };
  }

  // Trigger push all'autore del pezzo
  const { data: mittente } = await supabase
    .from("users")
    .select("nome_battesimo")
    .eq("id", user.id)
    .maybeSingle();

  // Conta gli echi non letti per badge sull'icona
  const badgeCount = await getUnreadEchiCount(pezzo.autore_id);

  inviaPushAUtente(pezzo.autore_id, {
    title: "Hai un eco",
    body: `${mittente?.nome_battesimo ?? "Qualcuno"} ti ha scritto un eco su un tuo pezzo.`,
    url: "/carteggi",
    tag: `eco-${pezzo.autore_id}`,
    appBadge: badgeCount,
  }).catch((e) => console.error("push eco:", e));

  redirect("/eco/inviato");
}

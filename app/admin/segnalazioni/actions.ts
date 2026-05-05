"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function ensureAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!data?.is_admin) {
    redirect("/feed");
  }

  return { supabase, user };
}

async function nascondiTarget(
  supabase: ReturnType<typeof createClient>,
  tipo: string,
  id: string
) {
  if (tipo === "pezzo") {
    await supabase.from("pezzi").update({ stato: "nascosto" }).eq("id", id);
  } else if (tipo === "eco") {
    await supabase.from("echi").update({ stato: "archiviato" }).eq("id", id);
  }
  // Per "utente" non c'è un nascondere il contenuto puntuale
}

export async function respingiSegnalazione(formData: FormData) {
  const { supabase, user } = await ensureAdmin();
  const id = formData.get("segnalazioneId");
  if (typeof id !== "string") return;

  await supabase
    .from("segnalazioni")
    .update({
      stato: "respinta",
      gestita_da: user.id,
      gestita_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath("/admin/segnalazioni");
}

export async function accettaSegnalazione(formData: FormData) {
  const { supabase, user } = await ensureAdmin();
  const id = formData.get("segnalazioneId");
  const tipo = formData.get("targetTipo");
  const targetId = formData.get("targetId");
  if (typeof id !== "string" || typeof tipo !== "string" || typeof targetId !== "string") return;

  await nascondiTarget(supabase, tipo, targetId);

  await supabase
    .from("segnalazioni")
    .update({
      stato: "accettata",
      gestita_da: user.id,
      gestita_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath("/admin/segnalazioni");
}

export async function accettaESospendi(formData: FormData) {
  const { supabase, user } = await ensureAdmin();
  const id = formData.get("segnalazioneId");
  const tipo = formData.get("targetTipo");
  const targetId = formData.get("targetId");
  const autoreId = formData.get("autoreId");
  if (
    typeof id !== "string" ||
    typeof tipo !== "string" ||
    typeof targetId !== "string" ||
    typeof autoreId !== "string"
  )
    return;

  await nascondiTarget(supabase, tipo, targetId);

  const fino = new Date();
  fino.setHours(fino.getHours() + 24);

  await supabase
    .from("users")
    .update({ stato: "sospeso", sospeso_fino_a: fino.toISOString() })
    .eq("id", autoreId);

  await supabase
    .from("segnalazioni")
    .update({
      stato: "accettata",
      gestita_da: user.id,
      gestita_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath("/admin/segnalazioni");
}

export async function accettaEBanna(formData: FormData) {
  const { supabase, user } = await ensureAdmin();
  const id = formData.get("segnalazioneId");
  const tipo = formData.get("targetTipo");
  const targetId = formData.get("targetId");
  const autoreId = formData.get("autoreId");
  if (
    typeof id !== "string" ||
    typeof tipo !== "string" ||
    typeof targetId !== "string" ||
    typeof autoreId !== "string"
  )
    return;

  await nascondiTarget(supabase, tipo, targetId);

  await supabase
    .from("users")
    .update({ stato: "bannato", sospeso_fino_a: null })
    .eq("id", autoreId);

  await supabase
    .from("segnalazioni")
    .update({
      stato: "accettata",
      gestita_da: user.id,
      gestita_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath("/admin/segnalazioni");
}

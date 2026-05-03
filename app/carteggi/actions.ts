"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function archiviaEco(formData: FormData) {
  const ecoId = formData.get("ecoId");
  if (typeof ecoId !== "string") return;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: eco } = await supabase
    .from("echi")
    .select("id, pezzo:pezzi!pezzo_id(autore_id)")
    .eq("id", ecoId)
    .maybeSingle();

  const pezzo = eco?.pezzo as unknown as { autore_id: string } | null;
  if (!eco || !pezzo || pezzo.autore_id !== user.id) return;

  await supabase
    .from("echi")
    .update({ stato: "non_risposto" })
    .eq("id", ecoId);

  revalidatePath("/carteggi");
}

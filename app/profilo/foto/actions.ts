"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  FOTO_BUCKET,
  FOTO_MAX_BYTES,
  FOTO_MIME_VALIDI,
  mimeToExt,
} from "@/lib/foto";

type State = { error: string | null };

export async function uploadFoto(
  _prev: State,
  formData: FormData
): Promise<State> {
  const file = formData.get("foto");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Nessuna foto selezionata." };
  }

  if (!FOTO_MIME_VALIDI.includes(file.type)) {
    return { error: "Formato non valido. Usa JPG, PNG o WebP." };
  }

  if (file.size > FOTO_MAX_BYTES) {
    return { error: "Foto troppo grande (massimo 5 MB)." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Cancello eventuale foto precedente in tutti i possibili formati
  // (potrei averne una con extension diversa)
  const possiblePaths = ["jpg", "png", "webp"].map(
    (ext) => `${user.id}/profilo.${ext}`
  );
  await supabase.storage.from(FOTO_BUCKET).remove(possiblePaths);

  // Carica la nuova
  const ext = mimeToExt(file.type);
  const path = `${user.id}/profilo.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(FOTO_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return { error: `Errore caricamento: ${uploadError.message}` };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(FOTO_BUCKET).getPublicUrl(path);

  // Aggiorna profilo con il nuovo URL (con cache buster timestamp)
  const fotoUrl = `${publicUrl}?v=${Date.now()}`;
  const { error: updateError } = await supabase
    .from("users")
    .update({ foto_url: fotoUrl })
    .eq("id", user.id);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath("/profilo");
  revalidatePath("/profilo/foto");
  redirect("/profilo");
}

export async function rimuoviFoto() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Cancella tutti i possibili file
  const possiblePaths = ["jpg", "png", "webp"].map(
    (ext) => `${user.id}/profilo.${ext}`
  );
  await supabase.storage.from(FOTO_BUCKET).remove(possiblePaths);

  // Reset foto_url
  await supabase
    .from("users")
    .update({ foto_url: null })
    .eq("id", user.id);

  // Reset eventuali sblocchi attivi nei carteggi (opzionale: per consistenza)
  // Il foto_sbloccata_a/b resta true, ma la foto è sparita. Non blocchiamo
  // il flusso: il display mostrerà semplicemente "ancora nessuna foto".

  revalidatePath("/profilo");
  revalidatePath("/profilo/foto");
  redirect("/profilo");
}

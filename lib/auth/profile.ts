import { createClient } from "@/lib/supabase/server";

export async function getCurrentProfile() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, profile: null };

  const { data: profile } = await supabase
    .from("users")
    .select("id, nome_battesimo, fascia_eta, citta, foto_url, stato, created_at")
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile };
}

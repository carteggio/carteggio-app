import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "non autenticato" }, { status: 401 });
  }

  const body = await request.json();
  const { endpoint, p256dh, auth_key, user_agent } = body;

  if (!endpoint || !p256dh || !auth_key) {
    return NextResponse.json({ error: "dati mancanti" }, { status: 400 });
  }

  // Upsert sull'endpoint (se esiste già, aggiorna)
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint,
      p256dh,
      auth_key,
      user_agent: user_agent ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

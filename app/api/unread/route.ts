import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUnreadEchiCount } from "@/lib/unread-server";

// La rotta dipende dai cookie di auth: niente cache, sempre dynamic
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { count: 0 },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }

  const count = await getUnreadEchiCount(user.id);
  return NextResponse.json(
    { count },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}

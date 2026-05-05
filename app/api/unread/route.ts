import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUnreadEchiCount } from "@/lib/unread-server";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ count: 0 });
  }

  const count = await getUnreadEchiCount(user.id);
  return NextResponse.json({ count });
}

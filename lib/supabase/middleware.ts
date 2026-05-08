import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Aggiorna la sessione Supabase per ogni request del middleware.
 *
 * Accetta opzionalmente un set di header da propagare alla request che Next
 * vede internamente (es. x-nonce per la CSP). Se non passati, vengono usati
 * gli header originali della request.
 */
export async function updateSession(
  request: NextRequest,
  requestHeaders?: Headers
) {
  const headers = requestHeaders ?? request.headers;
  let supabaseResponse = NextResponse.next({
    request: { headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({
            request: { headers },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Aggiorna il token JWT se è scaduto. Va chiamato per ogni richiesta.
  await supabase.auth.getUser();

  return supabaseResponse;
}

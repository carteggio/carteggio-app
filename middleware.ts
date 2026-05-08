import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { buildCsp } from "@/lib/csp";

export async function middleware(request: NextRequest) {
  // Genera un nonce univoco per ogni richiesta. btoa è disponibile nell'edge
  // runtime di Next/Vercel (Buffer no), e crypto.randomUUID() è web standard.
  const nonce = btoa(crypto.randomUUID());
  const isDev = process.env.NODE_ENV !== "production";
  const csp = buildCsp(nonce, isDev);

  // Propaga il nonce nella request così Next lo applica ai suoi inline script
  // RSC, e il nostro layout può leggerlo via headers() per gli script/style
  // inline custom (splash screen).
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  // updateSession gestisce la sessione Supabase; gli passiamo gli header
  // modificati così la response che ne risulta vede x-nonce nella request.
  const response = await updateSession(request, requestHeaders);

  // CSP applicata sulla response, una per request (nonce sempre fresco).
  response.headers.set("Content-Security-Policy", csp);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match tutte le richieste tranne:
     * - file statici di Next.js (_next/static, _next/image)
     * - favicon
     * - asset comuni
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

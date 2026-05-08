// Content-Security-Policy: costruita on-the-fly nel middleware per ogni request
// con un nonce dinamico. Il nonce viene poi letto dal layout via headers() e
// applicato ai (pochi) script/style inline che abbiamo. Tutto il resto degli
// inline che Next.js inietta per RSC streaming riceve il nonce automaticamente
// se il middleware ha settato l'header x-nonce sulla request.
//
// 'strict-dynamic' = se uno script con nonce/hash valido carica altri script
// dinamicamente (document.createElement('script')), quelli sono fidati senza
// dover essere whitelistati. Necessario perché Next 14 carica chunks dinamici.
//
// 'unsafe-eval' resta SOLO in dev: Next dev mode usa eval per HMR / Fast
// Refresh. In production non serve.

export function buildCsp(nonce: string, isDev: boolean): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      ...(isDev ? ["'unsafe-eval'"] : []),
      "https://challenges.cloudflare.com",
    ],
    "style-src": [
      "'self'",
      `'nonce-${nonce}'`,
      "https://fonts.googleapis.com",
    ],
    "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
    "img-src": ["'self'", "data:", "blob:", "https://*.supabase.co"],
    "connect-src": [
      "'self'",
      "https://*.supabase.co",
      "wss://*.supabase.co",
      "https://challenges.cloudflare.com",
    ],
    "frame-src": ["https://challenges.cloudflare.com"],
    "frame-ancestors": ["'none'"],
    "worker-src": ["'self'", "blob:"],
    "manifest-src": ["'self'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "object-src": ["'none'"],
    "upgrade-insecure-requests": [],
  };

  return Object.entries(directives)
    .map(([k, v]) => (v.length ? `${k} ${v.join(" ")}` : k))
    .join("; ");
}

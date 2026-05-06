/** @type {import('next').NextConfig} */

// Security headers — applicati a tutte le rotte.
// La CSP è scritta per consentire:
// - Supabase (HTTPS + WebSocket realtime)
// - Cloudflare Turnstile (CAPTCHA al login)
// - Google Fonts (Cormorant Garamond + Inter via next/font)
// - Service worker (push notifications)
// - Inline scripts/styles necessari a Next 14 RSC + Tailwind + splash inline
//
// In dev mode (next dev) la CSP è alleggerita per non rompere HMR / Fast Refresh.
const isProd = process.env.NODE_ENV === "production";

const cspDirectives = {
  "default-src": ["'self'"],
  "script-src": [
    "'self'",
    "'unsafe-inline'", // Next 14 RSC streaming + splash inline + Turnstile bootstrap
    "'unsafe-eval'", // necessario per alcune librerie + Next dev; rimuovere quando si introduce nonce
    "https://challenges.cloudflare.com",
  ],
  "style-src": [
    "'self'",
    "'unsafe-inline'", // Tailwind + style inline nello splash
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
  "frame-ancestors": ["'none'"], // anti clickjacking
  "worker-src": ["'self'", "blob:"], // service worker per push
  "manifest-src": ["'self'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "object-src": ["'none'"],
  "upgrade-insecure-requests": [],
};

function buildCsp() {
  return Object.entries(cspDirectives)
    .map(([k, v]) => (v.length ? `${k} ${v.join(" ")}` : k))
    .join("; ");
}

const securityHeaders = [
  // HSTS: forza HTTPS per 2 anni, includendo i sottodomini. preload opzionale ma consigliato per dominio nuovo.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Anti clickjacking: nessuno può embeddarci in iframe.
  { key: "X-Frame-Options", value: "DENY" },
  // Niente MIME sniffing.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Referrer minimo: niente path/query verso terze parti.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Permissions-Policy: nega capabilities che Carteggio non usa.
  {
    key: "Permissions-Policy",
    value: [
      "accelerometer=()",
      "camera=()",
      "geolocation=()",
      "gyroscope=()",
      "magnetometer=()",
      "microphone=()",
      "payment=()",
      "usb=()",
    ].join(", "),
  },
  // CSP applicata solo in prod per non interferire con HMR di next dev.
  ...(isProd
    ? [{ key: "Content-Security-Policy", value: buildCsp() }]
    : []),
];

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // useful for App Router progressive features
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

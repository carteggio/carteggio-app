/** @type {import('next').NextConfig} */

// Security headers statici, applicati a tutte le rotte.
//
// La Content-Security-Policy NON è qui: viene generata per ogni request nel
// middleware (app/middleware.ts) con un nonce dinamico, in modo da consentire
// gli inline script/style necessari (RSC streaming + splash) senza ricorrere
// a 'unsafe-inline'. Vedi lib/csp.ts per le direttive.

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

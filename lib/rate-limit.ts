/**
 * Rate limiter applicativo — basato su Upstash Redis (sliding window).
 *
 * In assenza di env vars Upstash, la funzione `checkRateLimit` ritorna sempre
 * `{ ok: true }`: in dev locale non serve un Redis attivo. In produzione su
 * Vercel le env vars devono essere settate, altrimenti il rate limit è disattivato.
 *
 * Convenzione di identificazione:
 * - per azioni autenticate: `user.id`
 * - per azioni pre-login (es. richiesta OTP): combinazione `phone` + IP
 *
 * I namespace separano contatori per azione (così un utente che pubblica
 * un pezzo non consuma il budget per inviare un eco).
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let redisInstance: Redis | null = null;
let redisInitTried = false;

function getRedis(): Redis | null {
  if (redisInitTried) return redisInstance;
  redisInitTried = true;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    redisInstance = null;
    return null;
  }
  redisInstance = new Redis({ url, token });
  return redisInstance;
}

export function isRateLimitConfigured(): boolean {
  return getRedis() !== null;
}

const limiterCache = new Map<string, Ratelimit>();

function getLimiter(
  name: string,
  limit: number,
  windowSeconds: number
): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;
  const cacheKey = `${name}:${limit}:${windowSeconds}`;
  let lim = limiterCache.get(cacheKey);
  if (!lim) {
    lim = new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      analytics: false,
      prefix: `rl:${name}`,
    });
    limiterCache.set(cacheKey, lim);
  }
  return lim;
}

export type RateLimitResult = {
  ok: boolean;
  /** Quanti secondi mancano al reset (solo se ok=false). */
  retryAfterSeconds?: number;
  /** Limite configurato per questa finestra (per log/debug). */
  limit?: number;
};

/**
 * Verifica e consuma un token nel rate limiter.
 * Esempio: checkRateLimit("send-otp:phone", "+39333...", 3, 3600)
 *   → consente 3 richieste OTP per quel numero in un'ora.
 */
export async function checkRateLimit(
  name: string,
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const lim = getLimiter(name, limit, windowSeconds);
  if (!lim) {
    // Rate limit non configurato: passa sempre. Logghiamo una volta in dev.
    return { ok: true };
  }
  if (!identifier) {
    // Identificatore mancante: meglio bloccare che lasciare passare.
    return { ok: false, retryAfterSeconds: windowSeconds, limit };
  }
  try {
    const result = await lim.limit(identifier);
    if (result.success) return { ok: true, limit };
    const retryAfterSeconds = Math.max(
      0,
      Math.ceil((result.reset - Date.now()) / 1000)
    );
    return { ok: false, retryAfterSeconds, limit };
  } catch (err) {
    // Errore di rete su Upstash: falliamo aperti per non rompere UX.
    // Loggare in produzione (Sentry) per accorgersene.
    console.error("[rate-limit] error", err);
    return { ok: true };
  }
}

/**
 * Estrae il client IP dagli header di una richiesta Vercel/Next.
 * Fallback "unknown" se nessun header utile è presente.
 */
export function getClientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    // x-forwarded-for può essere una lista; il primo è il client originale.
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const xri = headers.get("x-real-ip");
  if (xri) return xri.trim();
  // Vercel popola anche x-vercel-forwarded-for in alcuni edge.
  const xvff = headers.get("x-vercel-forwarded-for");
  if (xvff) return xvff.split(",")[0]?.trim() ?? "unknown";
  return "unknown";
}

/**
 * Limiti centralizzati per tutte le azioni — un solo posto da tunare.
 * Le finestre sono in secondi.
 */
export const LIMITS = {
  /** Richiesta OTP per numero di telefono (anti SMS pumping). */
  sendOtpByPhone: { limit: 3, windowSeconds: 3600 },
  /** Richiesta OTP per IP (anti distribuzione su numeri diversi). */
  sendOtpByIp: { limit: 5, windowSeconds: 3600 },
  /** Verifica OTP per numero (anti brute force codice). */
  verifyOtpByPhone: { limit: 10, windowSeconds: 3600 },
  /** Pubblicazione pezzo. */
  savePezzo: { limit: 5, windowSeconds: 3600 },
  /** Eco a un pezzo. */
  saveEco: { limit: 15, windowSeconds: 3600 },
  /** Apertura nuovo carteggio (prima lettera). */
  apriCarteggio: { limit: 5, windowSeconds: 3600 },
  /** Invio messaggio in carteggio aperto. */
  sendMessaggio: { limit: 60, windowSeconds: 3600 },
  /** Segnalazione abuso. */
  saveSegnalazione: { limit: 10, windowSeconds: 3600 },
} as const;

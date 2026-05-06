/**
 * Cloudflare Turnstile — verifica server-side del token CAPTCHA.
 *
 * Il widget client invia un campo nascosto `cf-turnstile-response` nel form.
 * Lato server, prima di azioni costose (es. signInWithOtp che spende SMS),
 * passiamo il token a `verifyTurnstile()` per validarlo presso Cloudflare.
 *
 * Se le env vars non sono configurate (locale dev senza account Cloudflare),
 * la verifica è bypassata: questo evita di bloccare lo sviluppo locale.
 * In produzione su Vercel le env vars DEVONO esserci, altrimenti il CAPTCHA
 * non protegge nulla.
 */

const VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export const TURNSTILE_TOKEN_FIELD = "cf-turnstile-response";

export function isTurnstileConfigured(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

/** Site key esposta al client. Vuota se non configurata. */
export function getTurnstileSiteKey(): string {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
}

/**
 * Verifica un token Turnstile presso il backend Cloudflare.
 * Ritorna `true` se il token è valido, `false` altrimenti.
 * Se la chiave secret non è configurata, ritorna `true` (modalità dev).
 */
export async function verifyTurnstile(
  token: string | null | undefined,
  remoteIp?: string | null
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  // Dev/local senza Turnstile: passa.
  if (!secret) return true;

  if (typeof token !== "string" || token.trim().length === 0) {
    return false;
  }

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      // mai cachare la verifica
      cache: "no-store",
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    // Errore di rete → falliamo chiusi (più sicuro)
    return false;
  }
}

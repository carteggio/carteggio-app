"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { verifyTurnstile, TURNSTILE_TOKEN_FIELD } from "@/lib/turnstile";
import {
  checkRateLimit,
  getClientIp,
  LIMITS,
} from "@/lib/rate-limit";

function normalizePhone(input: string): string {
  // Tieni solo "+" e cifre
  return input.replace(/[^\d+]/g, "");
}

function loginRedirect(message: string): never {
  redirect("/login?error=" + encodeURIComponent(message));
}

function verifyRedirect(phone: string, message: string): never {
  redirect(
    `/login/verify?phone=${encodeURIComponent(phone)}&error=` +
      encodeURIComponent(message)
  );
}

export async function sendOtp(formData: FormData) {
  const rawPhone = formData.get("phone");
  if (typeof rawPhone !== "string" || !rawPhone.trim()) {
    loginRedirect("Inserisci un numero di telefono.");
  }

  const phone = normalizePhone(rawPhone as string);
  if (!phone.startsWith("+") || phone.length < 8) {
    loginRedirect(
      "Numero non valido. Usa il formato internazionale (es. +39 333 1234567)."
    );
  }

  const reqHeaders = headers();
  const ip = getClientIp(reqHeaders);

  // 1) CAPTCHA: blocca SMS pumping su larga scala da bot.
  const captchaToken = formData.get(TURNSTILE_TOKEN_FIELD);
  const captchaOk = await verifyTurnstile(
    typeof captchaToken === "string" ? captchaToken : null,
    ip
  );
  if (!captchaOk) {
    loginRedirect(
      "Verifica anti-bot fallita. Ricarica la pagina e riprova."
    );
  }

  // 2) Rate limit per numero (anti abuso mirato): max 3 OTP/ora per numero.
  const phoneLimit = await checkRateLimit(
    "send-otp:phone",
    phone,
    LIMITS.sendOtpByPhone.limit,
    LIMITS.sendOtpByPhone.windowSeconds
  );
  if (!phoneLimit.ok) {
    const minuti = Math.ceil((phoneLimit.retryAfterSeconds ?? 3600) / 60);
    loginRedirect(
      `Troppi tentativi su questo numero. Riprova tra circa ${minuti} minuti.`
    );
  }

  // 3) Rate limit per IP (anti distribuzione su tanti numeri).
  const ipLimit = await checkRateLimit(
    "send-otp:ip",
    ip,
    LIMITS.sendOtpByIp.limit,
    LIMITS.sendOtpByIp.windowSeconds
  );
  if (!ipLimit.ok) {
    const minuti = Math.ceil((ipLimit.retryAfterSeconds ?? 3600) / 60);
    loginRedirect(
      `Troppi tentativi da questa connessione. Riprova tra circa ${minuti} minuti.`
    );
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({ phone });

  if (error) {
    loginRedirect(error.message);
  }

  redirect(`/login/verify?phone=${encodeURIComponent(phone)}`);
}

export async function verifyOtp(formData: FormData) {
  const phone = formData.get("phone");
  const token = formData.get("token");

  if (typeof phone !== "string" || typeof token !== "string") {
    redirect("/login");
  }

  // Rate limit anti brute force sul codice (max 10 tentativi/ora per numero).
  const phoneLimit = await checkRateLimit(
    "verify-otp:phone",
    phone as string,
    LIMITS.verifyOtpByPhone.limit,
    LIMITS.verifyOtpByPhone.windowSeconds
  );
  if (!phoneLimit.ok) {
    const minuti = Math.ceil((phoneLimit.retryAfterSeconds ?? 3600) / 60);
    verifyRedirect(
      phone as string,
      `Troppi tentativi. Riprova tra circa ${minuti} minuti.`
    );
  }

  const supabase = createClient();
  const { error } = await supabase.auth.verifyOtp({
    phone: phone as string,
    token: (token as string).trim(),
    type: "sms",
  });

  if (error) {
    verifyRedirect(phone as string, error.message);
  }

  redirect("/benvenuto");
}

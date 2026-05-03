"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function normalizePhone(input: string): string {
  // Tieni solo "+" e cifre
  return input.replace(/[^\d+]/g, "");
}

export async function sendOtp(formData: FormData) {
  const rawPhone = formData.get("phone");
  if (typeof rawPhone !== "string" || !rawPhone.trim()) {
    redirect("/login?error=" + encodeURIComponent("Inserisci un numero di telefono."));
  }

  const phone = normalizePhone(rawPhone as string);
  if (!phone.startsWith("+") || phone.length < 8) {
    redirect(
      "/login?error=" +
        encodeURIComponent("Numero non valido. Usa il formato internazionale (es. +39 333 1234567).")
    );
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({ phone });

  if (error) {
    redirect("/login?error=" + encodeURIComponent(error.message));
  }

  redirect(`/login/verify?phone=${encodeURIComponent(phone)}`);
}

export async function verifyOtp(formData: FormData) {
  const phone = formData.get("phone");
  const token = formData.get("token");

  if (typeof phone !== "string" || typeof token !== "string") {
    redirect("/login");
  }

  const supabase = createClient();
  const { error } = await supabase.auth.verifyOtp({
    phone: phone as string,
    token: (token as string).trim(),
    type: "sms",
  });

  if (error) {
    redirect(
      `/login/verify?phone=${encodeURIComponent(phone as string)}&error=` +
        encodeURIComponent(error.message)
    );
  }

  redirect("/benvenuto");
}

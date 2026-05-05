import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Crea un client Supabase con privilegi service_role.
 * Usato server-side per operazioni che richiedono di bypassare RLS,
 * tipo inviare push notifications a un altro utente.
 *
 * MAI esporre questo client al browser.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

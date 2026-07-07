import "server-only";
import { createClient } from "@supabase/supabase-js";

// Cliente con service role: bypasea RLS. Úsalo solo en contextos
// server-only sin sesión de usuario (ej. webhooks), nunca en el cliente.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

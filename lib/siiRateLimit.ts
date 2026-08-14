import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// Sin esto, cualquier sesión autenticada podía llamar a las rutas SII
// sin límite — superficie para probar credenciales SII de terceros
// (brute-force) o para agotar los créditos pagados de API Gateway.
// Se apoya en sii_sincronizaciones (donde ya quedan registrados todos
// los intentos, exitosos o no) en vez de agregar una dependencia nueva
// de tipo Redis solo para esto.
const WINDOW_MINUTES = 15;
const MAX_INTENTOS = 5;

export async function siiRateLimitExceeded(
  supabase: SupabaseClient,
  companyId: string
): Promise<boolean> {
  const desde = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();

  const { count, error } = await supabase
    .from("sii_sincronizaciones")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .gte("created_at", desde);

  if (error) {
    // No se debe bloquear al usuario por un problema nuestro de
    // lectura, pero si esto pasa siempre, el rate-limit queda inútil
    // en silencio — hay que verlo en los logs.
    console.error("Error consultando rate-limit SII:", error.message);
    return false;
  }

  return (count ?? 0) >= MAX_INTENTOS;
}

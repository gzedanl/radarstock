import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  fetchRcvDocumentos,
  SiiCredencialesInvalidasError,
  type SiiDocTipo,
  type SiiDocumentoNormalizado,
} from "@/lib/sii";
import { isTrialExpired } from "@/lib/trialStatus";
import { siiRateLimitExceeded } from "@/lib/siiRateLimit";

// Un período con muchos documentos implica varias llamadas
// secuenciales a API Gateway (una por tipo de DTE) — igual que el
// upload de productos, puede acercarse al default de Vercel.
export const maxDuration = 300;

function mapRowsForInsert(
  companyId: string,
  tipo: SiiDocTipo,
  periodo: string,
  documentos: SiiDocumentoNormalizado[]
) {
  return documentos
    .filter((doc) => doc.folio)
    .map((doc) => ({
      company_id: companyId,
      tipo,
      folio: doc.folio,
      rut_contraparte: doc.rutContraparte,
      razon_social_contraparte: doc.razonSocialContraparte,
      fecha_emision: doc.fechaEmision,
      periodo,
      monto: doc.monto,
      estado_sii: doc.estadoSii,
      raw_data: doc.raw,
    }));
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const rut = typeof body?.rut === "string" ? body.rut.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  // Formato YYYY-MM, igual que el resto de la app (ver lib/sii.ts).
  const periodo =
    typeof body?.periodo === "string" && /^\d{4}-\d{2}$/.test(body.periodo)
      ? body.periodo
      : new Date().toISOString().slice(0, 7);

  if (!rut || !password) {
    return NextResponse.json(
      { error: "Falta RUT o clave SII." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: company } = await supabase
    .from("companies")
    .select("id, plan, trial_ends_at")
    .eq("user_id", user.id)
    .single();

  if (!company) {
    return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
  }

  if (isTrialExpired(company.plan, company.trial_ends_at)) {
    return NextResponse.json(
      { error: "Tu período de prueba terminó. Suscríbete a un plan para seguir usando RadarStock." },
      { status: 402 }
    );
  }

  if (await siiRateLimitExceeded(supabase, company.id)) {
    return NextResponse.json(
      { error: "Demasiados intentos de sincronización. Espera unos minutos y vuelve a intentar." },
      { status: 429 }
    );
  }

  const credenciales = { rut, password };
  const errores: string[] = [];

  const [comprasResult, ventasResult] = await Promise.allSettled([
    fetchRcvDocumentos(credenciales, "compra", periodo),
    fetchRcvDocumentos(credenciales, "venta", periodo),
  ]);

  const credencialesInvalidas =
    (comprasResult.status === "rejected" &&
      comprasResult.reason instanceof SiiCredencialesInvalidasError) ||
    (ventasResult.status === "rejected" &&
      ventasResult.reason instanceof SiiCredencialesInvalidasError);

  if (credencialesInvalidas) {
    // Se registra igual que un intento fallido — si no, las credenciales
    // incorrectas nunca contarían para el rate-limit y alguien podría
    // probar claves sin límite mientras sigan siendo inválidas.
    const { error: logError } = await supabase
      .from("sii_sincronizaciones")
      .insert({
        company_id: company.id,
        periodo,
        estado: "error",
        compras_sincronizadas: 0,
        ventas_sincronizadas: 0,
        mensaje_error: "Credenciales SII incorrectas.",
      });
    if (logError) {
      console.error("Error registrando intento SII:", logError.message);
    }
    return NextResponse.json(
      { error: "Credenciales SII incorrectas." },
      { status: 401 }
    );
  }

  const rowsToUpsert: ReturnType<typeof mapRowsForInsert> = [];

  if (comprasResult.status === "fulfilled") {
    rowsToUpsert.push(
      ...mapRowsForInsert(company.id, "compra", periodo, comprasResult.value)
    );
  } else {
    console.error("Error sincronizando compras SII:", comprasResult.reason);
    errores.push("No se pudieron sincronizar las compras.");
  }

  if (ventasResult.status === "fulfilled") {
    rowsToUpsert.push(
      ...mapRowsForInsert(company.id, "venta", periodo, ventasResult.value)
    );
  } else {
    console.error("Error sincronizando ventas SII:", ventasResult.reason);
    errores.push("No se pudieron sincronizar las ventas.");
  }

  if (rowsToUpsert.length > 0) {
    const { error: upsertError } = await supabase
      .from("sii_documentos")
      .upsert(rowsToUpsert, { onConflict: "company_id,tipo,folio,periodo" });

    if (upsertError) {
      console.error("Error guardando documentos SII:", upsertError.message);
      errores.push("No se pudieron guardar algunos documentos.");
    }
  }

  const comprasSincronizadas =
    comprasResult.status === "fulfilled" ? comprasResult.value.length : 0;
  const ventasSincronizadas =
    ventasResult.status === "fulfilled" ? ventasResult.value.length : 0;

  const { error: logError } = await supabase
    .from("sii_sincronizaciones")
    .insert({
      company_id: company.id,
      periodo,
      estado: errores.length === 0 ? "ok" : "error",
      compras_sincronizadas: comprasSincronizadas,
      ventas_sincronizadas: ventasSincronizadas,
      mensaje_error: errores.length > 0 ? errores.join(" ") : null,
    });
  if (logError) {
    console.error("Error registrando sincronización SII:", logError.message);
  }

  return NextResponse.json({
    ok: errores.length === 0,
    periodo,
    compras: comprasSincronizadas,
    ventas: ventasSincronizadas,
    errores,
  });
}

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { refreshPredictionsForProducts } from "@/lib/refreshPredictions";
import { verifyCronSecret } from "@/lib/verifyCronSecret";

// Prophet/LSTM pueden tardar unos segundos por producto — con varias
// empresas y catálogos grandes esto puede acercarse al límite por
// defecto de las funciones de Vercel.
export const maxDuration = 300;

interface CompanyRow {
  id: string;
  rubro: string | null;
  comuna: string | null;
  products: {
    id: string;
    sku: string;
    stock_actual: number;
    ventas_historicas: { fecha: string; ventas: number }[];
  }[];
}

// Disparado por el cron de Vercel (ver vercel.json), antes del cron de
// check-alerts, para que las alertas se calculen sobre predicciones
// frescas en vez de la última que haya quedado guardada de un upload
// de CSV anterior.
export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabaseAdmin = createAdminClient();

  const { data: companies, error } = await supabaseAdmin
    .from("companies")
    .select("id, rubro, comuna, products(id, sku, stock_actual, ventas_historicas)")
    .returns<CompanyRow[]>();

  if (error) {
    console.error(
      "Error leyendo companies para refresh-predictions:",
      error.message
    );
    return NextResponse.json({ error: "Error leyendo empresas" }, { status: 500 });
  }

  let empresasProcesadas = 0;
  let productosActualizados = 0;
  let mlUsadoTotal = 0;

  // Secuencial a propósito: no queremos golpear el servicio ML (free
  // tier de Render) con las llamadas de todas las empresas en paralelo.
  for (const company of companies ?? []) {
    if (!company.products || company.products.length === 0) continue;

    const { updated, mlUsedCount } = await refreshPredictionsForProducts(
      supabaseAdmin,
      company.products,
      { rubro: company.rubro, comuna: company.comuna }
    );

    empresasProcesadas += 1;
    productosActualizados += updated;
    mlUsadoTotal += mlUsedCount;
  }

  return NextResponse.json({
    status: "ok",
    empresas_procesadas: empresasProcesadas,
    productos_actualizados: productosActualizados,
    ml_usado: mlUsadoTotal,
  });
}

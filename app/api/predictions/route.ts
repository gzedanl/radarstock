import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { refreshPredictionsForProducts } from "@/lib/refreshPredictions";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!company) {
    return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
  }

  const { data: rows } = await supabase
    .from("products")
    .select(
      "sku, predictions(dias_hasta_quiebre, cantidad_sugerida, generated_at)"
    )
    .eq("company_id", company.id);

  return NextResponse.json({ predictions: rows ?? [], source: "supabase" });
}

// Recalcula las predicciones de todos los productos de la empresa
// llamando al servicio ML, sin necesidad de volver a subir el CSV.
// Pensado para un botón "actualizar predicciones" o un cron (Fase 4).
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: company } = await supabase
    .from("companies")
    .select("id, rubro, comuna")
    .eq("user_id", user.id)
    .single();

  if (!company) {
    return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
  }

  const { data: products } = await supabase
    .from("products")
    .select("id, sku, stock_actual, ventas_historicas")
    .eq("company_id", company.id);

  const { updated, mlUsedCount } = await refreshPredictionsForProducts(
    supabase,
    products ?? [],
    { rubro: company.rubro, comuna: company.comuna }
  );

  return NextResponse.json({
    status: "ok",
    productos: products?.length ?? 0,
    actualizados: updated,
    ml_usado: mlUsedCount,
  });
}

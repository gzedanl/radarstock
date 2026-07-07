import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { parseProductRows } from "@/lib/csvProducts";
import { PLANS } from "@/lib/plans";
import { refreshPredictionsForProducts } from "@/lib/refreshPredictions";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body || !Array.isArray(body.rows)) {
    return NextResponse.json(
      { error: "Se esperaba { rows: Array<Record<string,string>> }" },
      { status: 400 }
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: company } = await supabase
    .from("companies")
    .select("id, plan")
    .eq("user_id", user.id)
    .single();

  if (!company) {
    return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
  }

  const parsedRows = parseProductRows(body.rows);

  if (parsedRows.length === 0) {
    return NextResponse.json(
      { error: "El CSV no tiene filas válidas (falta columna 'sku')." },
      { status: 400 }
    );
  }

  const planLimits = PLANS[company.plan as keyof typeof PLANS];
  const maxSkus = planLimits?.maxSkus ?? PLANS.starter.maxSkus;
  const truncated = parsedRows.length > maxSkus;
  const rowsToSave = truncated ? parsedRows.slice(0, maxSkus) : parsedRows;

  const { data: upsertedProducts, error: productsError } = await supabase
    .from("products")
    .upsert(
      rowsToSave.map((row) => ({
        company_id: company.id,
        sku: row.sku,
        stock_actual: row.stock_actual,
        ventas_historicas: row.ventas_historicas,
      })),
      { onConflict: "company_id,sku" }
    )
    .select("id, sku, stock_actual, ventas_historicas");

  if (productsError) {
    console.error("Error guardando productos:", productsError.message);
    return NextResponse.json(
      { error: "No se pudieron guardar los productos." },
      { status: 500 }
    );
  }

  // Llama al servicio ML real por cada producto. Si no responde, cae al
  // cálculo placeholder solo para productos nuevos sin predicción previa
  // — los que ya tenían una quedan intactos (ver refreshPredictions.ts).
  const { mlUsedCount } = await refreshPredictionsForProducts(
    supabase,
    upsertedProducts ?? []
  );

  return NextResponse.json({
    status: "ok",
    received: body.rows.length,
    saved: rowsToSave.length,
    truncated,
    limit: maxSkus,
    ml_usado: mlUsedCount,
  });
}

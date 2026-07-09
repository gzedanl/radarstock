import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { callMlPredict } from "@/lib/mlService";
import { computePlaceholderPrediction } from "@/lib/predictPlaceholder";

interface ProductForPrediction {
  id: string;
  sku: string;
  stock_actual: number;
  ventas_historicas: { fecha: string; ventas: number }[];
}

interface CompanyContext {
  rubro: string | null;
  comuna: string | null;
}

// Llama al servicio ML por cada producto y guarda el resultado. Si el
// servicio ML no responde para un producto que YA tenía una predicción
// guardada, esa fila se deja intacta (queda "no actualizada hoy" según
// generated_at) en vez de sobreescribirla con un cálculo falso-fresco.
// Solo los productos sin predicción previa reciben el cálculo
// placeholder como fallback, para no dejarlos sin nada.
export async function refreshPredictionsForProducts(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  products: ProductForPrediction[],
  companyContext?: CompanyContext
): Promise<{ updated: number; mlUsedCount: number }> {
  if (products.length === 0) return { updated: 0, mlUsedCount: 0 };

  const productIds = products.map((p) => p.id);
  const { data: existingPredictions } = await supabase
    .from("predictions")
    .select("product_id")
    .in("product_id", productIds);
  const existingSet = new Set(
    (existingPredictions ?? []).map((p: { product_id: string }) => p.product_id)
  );

  let mlUsedCount = 0;

  const results = await Promise.all(
    products.map(async (product) => {
      const mlResult = await callMlPredict({
        sku: product.sku,
        ventas_historicas: product.ventas_historicas.map((v) => v.ventas),
        fechas: product.ventas_historicas.map((v) => v.fecha),
        stock_actual: product.stock_actual,
        rubro: companyContext?.rubro ?? undefined,
        comuna: companyContext?.comuna ?? undefined,
      });

      if (mlResult) {
        mlUsedCount += 1;
        return {
          product_id: product.id,
          dias_hasta_quiebre: mlResult.dias_hasta_quiebre,
          cantidad_sugerida: mlResult.cantidad_sugerida,
          escenario: "base",
          generated_at: new Date().toISOString(),
        };
      }

      if (!existingSet.has(product.id)) {
        const fallback = computePlaceholderPrediction({
          stock_actual: product.stock_actual,
          ventas_historicas: product.ventas_historicas,
        });
        return {
          product_id: product.id,
          dias_hasta_quiebre: fallback.dias_hasta_quiebre,
          cantidad_sugerida: fallback.cantidad_sugerida,
          escenario: "base",
          generated_at: new Date().toISOString(),
        };
      }

      return null;
    })
  );

  const predictionRows = results.filter(
    (r): r is NonNullable<typeof r> => r !== null
  );

  if (predictionRows.length > 0) {
    await supabase
      .from("predictions")
      .upsert(predictionRows, { onConflict: "product_id" });
  }

  return { updated: predictionRows.length, mlUsedCount };
}

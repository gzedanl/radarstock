import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { callMlPredict } from "@/lib/mlService";
import { computePlaceholderPrediction } from "@/lib/predictPlaceholder";
import { mapWithConcurrency } from "@/lib/mapWithConcurrency";

interface ProductForPrediction {
  id: string;
  sku: string;
  stock_actual: number;
  ventas_historicas: { fecha: string; ventas: number }[];
}

// radarstock-ml corre un solo proceso uvicorn (CPU-bound: entrena
// Prophet/LSTM por request). Disparar todos los productos de un
// catálogo grande a la vez con Promise.all satura ese único proceso y
// hace que la mayoría de las llamadas expiren el timeout de
// callMlPredict — mejor pedir de a poco.
const ML_PREDICT_CONCURRENCY = 5;

interface CompanyContext {
  rubro: string | null;
  comuna: string | null;
}

// Llama al servicio ML por cada producto y guarda el resultado. Si el
// servicio ML no respondió síncrono para un producto que YA tenía una
// predicción guardada —sea porque no está disponible, o porque encoló
// el job para procesarlo de forma asíncrona (ver lib/mlService.ts)—,
// esa fila se deja intacta (queda "no actualizada hoy" según
// generated_at) en vez de sobreescribirla con un cálculo falso-fresco.
// Cuando el job encolado termine, el worker de radarstock-ml escribe el
// resultado directo en Supabase y la próxima carga del dashboard ya lo
// ve — no hace falta que este endpoint espere nada.
// Solo los productos sin predicción previa reciben el cálculo
// placeholder como fallback, para no dejarlos sin nada mientras tanto.
export async function refreshPredictionsForProducts(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  products: ProductForPrediction[],
  companyContext?: CompanyContext
): Promise<{ updated: number; mlUsedCount: number; mlEncoladoCount: number }> {
  if (products.length === 0) {
    return { updated: 0, mlUsedCount: 0, mlEncoladoCount: 0 };
  }

  const productIds = products.map((p) => p.id);
  const { data: existingPredictions } = await supabase
    .from("predictions")
    .select("product_id")
    .in("product_id", productIds);
  const existingSet = new Set(
    (existingPredictions ?? []).map((p: { product_id: string }) => p.product_id)
  );

  let mlUsedCount = 0;
  let mlEncoladoCount = 0;

  const results = await mapWithConcurrency(
    products,
    ML_PREDICT_CONCURRENCY,
    async (product) => {
      const mlResult = await callMlPredict({
        product_id: product.id,
        sku: product.sku,
        ventas_historicas: product.ventas_historicas.map((v) => v.ventas),
        fechas: product.ventas_historicas.map((v) => v.fecha),
        stock_actual: product.stock_actual,
        rubro: companyContext?.rubro ?? undefined,
        comuna: companyContext?.comuna ?? undefined,
      });

      if (mlResult.type === "sync") {
        mlUsedCount += 1;
        return {
          product_id: product.id,
          dias_hasta_quiebre: mlResult.data.dias_hasta_quiebre,
          cantidad_sugerida: mlResult.data.cantidad_sugerida,
          escenario: "base",
          generated_at: new Date().toISOString(),
        };
      }

      if (mlResult.type === "queued") {
        mlEncoladoCount += 1;
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
    }
  );

  const predictionRows = results.filter(
    (r): r is NonNullable<typeof r> => r !== null
  );

  if (predictionRows.length > 0) {
    await supabase
      .from("predictions")
      .upsert(predictionRows, { onConflict: "product_id" });
  }

  return { updated: predictionRows.length, mlUsedCount, mlEncoladoCount };
}

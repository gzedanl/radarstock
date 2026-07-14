import "server-only";

export interface MlPredictRequest {
  product_id: string;
  sku: string;
  ventas_historicas: number[];
  fechas?: string[];
  stock_actual: number;
  modelo?: "prophet" | "lstm" | "ensemble";
  rubro?: string;
  comuna?: string;
}

export interface MlPredictResponse {
  sku: string;
  dias_hasta_quiebre: number | null;
  cantidad_sugerida: number;
  escenarios: { base: number; optimista: number; pesimista: number };
  modelo_usado: string;
  alerta_insumos: { commodity: string; variacion_pct_7d: number; mensaje: string }[];
}

// radarstock-ml responde 200 con el resultado ya calculado (sin cola
// configurada del lado del servicio ML), o 202 cuando encoló el job y
// un worker lo procesará de forma asíncrona — ver services/queue.py en
// ese repo. "unavailable" cubre timeout/caído/error, igual que antes.
export type MlPredictResult =
  | { type: "sync"; data: MlPredictResponse }
  | { type: "queued" }
  | { type: "unavailable" };

const TIMEOUT_MS = 8000;

// Nunca lanza: si el servicio ML no responde (timeout, caído, error),
// devuelve "unavailable" y el caller decide el fallback. El dashboard
// nunca debe romperse porque radarstock-ml/ no esté disponible.
export async function callMlPredict(
  payload: MlPredictRequest
): Promise<MlPredictResult> {
  const mlServiceUrl = process.env.ML_SERVICE_URL;
  const token = process.env.INTERNAL_SERVICE_TOKEN;

  if (!mlServiceUrl || !token) {
    console.error("ML_SERVICE_URL o INTERNAL_SERVICE_TOKEN no configurados");
    return { type: "unavailable" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${mlServiceUrl}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Token": token,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (res.status === 202) {
      return { type: "queued" };
    }

    if (!res.ok) {
      console.error("Servicio ML respondió", res.status, await res.text());
      return { type: "unavailable" };
    }

    return { type: "sync", data: (await res.json()) as MlPredictResponse };
  } catch (err) {
    console.error(
      "Error llamando al servicio ML:",
      err instanceof Error ? err.message : err
    );
    return { type: "unavailable" };
  } finally {
    clearTimeout(timeout);
  }
}

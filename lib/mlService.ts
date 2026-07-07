import "server-only";

export interface MlPredictRequest {
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

const TIMEOUT_MS = 8000;

// Nunca lanza: si el servicio ML no responde (timeout, caído, error),
// devuelve null y el caller decide el fallback. El dashboard nunca debe
// romperse porque radarstock-ml/ no esté disponible.
export async function callMlPredict(
  payload: MlPredictRequest
): Promise<MlPredictResponse | null> {
  const mlServiceUrl = process.env.ML_SERVICE_URL;
  const token = process.env.INTERNAL_SERVICE_TOKEN;

  if (!mlServiceUrl || !token) {
    console.error("ML_SERVICE_URL o INTERNAL_SERVICE_TOKEN no configurados");
    return null;
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

    if (!res.ok) {
      console.error("Servicio ML respondió", res.status, await res.text());
      return null;
    }

    return (await res.json()) as MlPredictResponse;
  } catch (err) {
    console.error(
      "Error llamando al servicio ML:",
      err instanceof Error ? err.message : err
    );
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

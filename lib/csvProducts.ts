export interface ParsedProductRow {
  sku: string;
  stock_actual: number;
  lead_time_dias: number;
  ventas_historicas: { fecha: string; ventas: number }[];
}

const SKU_KEYS = ["sku"];
const STOCK_KEYS = ["stock", "stock_actual"];
// Pre-Fase 4 (P2.2): columna opcional con los días que demora la
// reposición de ese SKU (proveedor + logística). Si no viene, queda en 0
// y el cálculo de riesgo se comporta igual que antes.
const LEAD_TIME_KEYS = ["lead_time", "lead_time_dias", "tiempo_entrega"];

function normalizeKey(key: string): string {
  return key.trim().toLowerCase();
}

// Formato esperado del CSV (ancho): una columna sku, una columna stock,
// y una columna por cada fecha con las ventas de ese día.
export function parseProductRows(
  rows: Record<string, string>[]
): ParsedProductRow[] {
  const parsed: ParsedProductRow[] = [];

  for (const row of rows) {
    let sku: string | null = null;
    let stockActual = 0;
    let leadTimeDias = 0;
    const ventasHistoricas: { fecha: string; ventas: number }[] = [];

    for (const [rawKey, rawValue] of Object.entries(row)) {
      const key = normalizeKey(rawKey);
      const value = (rawValue ?? "").toString().trim();

      if (SKU_KEYS.includes(key)) {
        sku = value;
        continue;
      }
      if (STOCK_KEYS.includes(key)) {
        stockActual = Number(value) || 0;
        continue;
      }
      if (LEAD_TIME_KEYS.includes(key)) {
        leadTimeDias = Math.max(0, Number(value) || 0);
        continue;
      }
      const ventas = Number(value);
      if (value !== "" && !Number.isNaN(ventas)) {
        ventasHistoricas.push({ fecha: rawKey.trim(), ventas });
      }
    }

    if (!sku) continue;

    parsed.push({
      sku,
      stock_actual: stockActual,
      lead_time_dias: leadTimeDias,
      ventas_historicas: ventasHistoricas,
    });
  }

  return parsed;
}

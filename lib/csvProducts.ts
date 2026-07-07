export interface ParsedProductRow {
  sku: string;
  stock_actual: number;
  ventas_historicas: { fecha: string; ventas: number }[];
}

const SKU_KEYS = ["sku"];
const STOCK_KEYS = ["stock", "stock_actual"];

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
      const ventas = Number(value);
      if (value !== "" && !Number.isNaN(ventas)) {
        ventasHistoricas.push({ fecha: rawKey.trim(), ventas });
      }
    }

    if (!sku) continue;

    parsed.push({ sku, stock_actual: stockActual, ventas_historicas: ventasHistoricas });
  }

  return parsed;
}
